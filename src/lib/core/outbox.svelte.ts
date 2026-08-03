interface Mutation {
	/** Auto-Increment-Schluessel = Einfuegereihenfolge. Siehe openDb(). */
	seq?: number;
	table: string;
	operation: 'insert' | 'update' | 'delete';
	payload: unknown;
	createdAt: string;
	/** Fehlgeschlagene Zustellversuche. Ab MAX_ATTEMPTS -> Dead Letter. */
	attempts: number;
	/** Letzte Fehlermeldung — fuer die Diagnose im Dead-Letter-Store. */
	lastError?: string;
}

interface Executor {
	insert?: (payload: unknown) => Promise<unknown>;
	update?: (payload: unknown) => Promise<unknown>;
	delete?: (payload: unknown) => Promise<unknown>;
}

const DB_NAME = 'lifeos-outbox';
const DB_VERSION = 2;
const STORE_NAME = 'mutations';
const DEAD_STORE = 'dead';

/**
 * Nach so vielen vergeblichen Versuchen gilt eine Mutation als unzustellbar
 * (Constraint-Verletzung, RLS-Ablehnung, geloeschte Zielzeile) und wandert in
 * den Dead-Letter-Store. Ohne diese Grenze blockiert ein einziger kaputter
 * Eintrag die Queue dauerhaft.
 */
const MAX_ATTEMPTS = 5;

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = request.result;
			const tx = request.transaction!;

			if (!db.objectStoreNames.contains(DEAD_STORE)) {
				db.createObjectStore(DEAD_STORE, { keyPath: 'seq', autoIncrement: true });
			}

			if (event.oldVersion < 1) {
				db.createObjectStore(STORE_NAME, { keyPath: 'seq', autoIncrement: true });
				return;
			}

			if (event.oldVersion < 2) {
				// v1 nutzte `keyPath: 'id'` mit crypto.randomUUID(). getAll() liefert in
				// SCHLUESSEL-Reihenfolge — bei zufaelligen UUIDs also zufaellig. Ein Update
				// konnte damit vor seinem Insert abgespielt werden; Supabase meldet ein
				// Update ohne Treffer nicht als Fehler, die Aenderung war still verloren.
				// Ab v2 ist der Schluessel ein Auto-Increment: getAll() ist per
				// Konstruktion die Einfuegereihenfolge.
				const alt = tx.objectStore(STORE_NAME);
				const gespeichert = alt.getAll();
				gespeichert.onsuccess = () => {
					const alteEintraege = (gespeichert.result ?? []) as Array<
						Omit<Mutation, 'seq' | 'attempts'> & { attempts?: number }
					>;
					db.deleteObjectStore(STORE_NAME);
					const neu = db.createObjectStore(STORE_NAME, { keyPath: 'seq', autoIncrement: true });
					// createdAt ist die beste Reihenfolge, die sich aus v1 noch herstellen laesst.
					for (const e of alteEintraege.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
						neu.add({
							table: e.table,
							operation: e.operation,
							payload: e.payload,
							createdAt: e.createdAt,
							attempts: e.attempts ?? 0
						});
					}
				};
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function txDone(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}

function req<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Ist der Fehler durch Wiederholen nicht zu beheben?
 *
 * HINTERGRUND: Bisher wanderte JEDER Fehler in die Queue und wurde fuenfmal
 * versucht. Bei einer abgelehnten RLS-Pruefung oder einer Constraint-Verletzung
 * ist das sinnlos — die Mutation blockiert dabei fuenf Durchlaeufe lang alle
 * spaeteren Aenderungen derselben Tabelle (siehe `blockiert` in durchlauf()),
 * und der Nutzer erfaehrt erst nach dem fuenften Versuch davon.
 *
 * Vorsichtig gewaehlt: nur was eindeutig fachlich ist. Alles Unklare bleibt bei
 * der Wiederholung — ein faelschlich verworfener Schreibvorgang waere teurer als
 * ein paar vergebliche Versuche.
 */
export function istDauerhaft(err: unknown): boolean {
	if (!err || typeof err !== 'object') return false;
	const e = err as { code?: unknown; status?: unknown };

	const code = typeof e.code === 'string' ? e.code : '';
	// Postgres-SQLSTATE: 23xxx = Integritaetsverletzung (unique, foreign key,
	// not null, check), 42501 = insufficient_privilege, also RLS.
	if (code.startsWith('23') || code === '42501') return true;
	// PGRST301 = JWT abgelaufen. Das laesst sich nicht durch Wiederholen loesen,
	// aber der Refresh im Client kann es — daher NICHT als dauerhaft werten.

	const status = typeof e.status === 'number' ? e.status : null;
	if (status === null) return false;
	// 408 Timeout und 429 Rate Limit sind ausdruecklich zum Wiederholen gedacht,
	// 401/403 dagegen koennen nach einem Token-Refresh gutgehen.
	if (status === 408 || status === 429 || status === 401 || status === 403) return false;
	return status >= 400 && status < 500;
}

function fehlertext(err: unknown): string {
	if (err instanceof Error) return err.message;
	if (typeof err === 'object' && err && 'message' in err) return String(err.message);
	return String(err);
}

class Outbox {
	status = $state<'idle' | 'syncing' | 'error'>('idle');
	/** Wartende Mutationen insgesamt — treibt das Sync-Banner. */
	pending = $state(0);
	/** Endgueltig gescheiterte Mutationen. Werden nicht mehr erneut versucht. */
	dead = $state(0);

	private executors = new Map<string, Executor>();
	/** Wartende Mutationen je Tabelle — entscheidet ueber Direktschreiben. */
	private offenProTabelle = new Map<string, number>();
	/** Laufender Durchlauf. `replay()` haengt sich dran, statt sofort zurueckzukehren. */
	private laufend: Promise<void> | null = null;

	registerExecutor(table: string, executor: Executor) {
		this.executors.set(table, executor);
		// Der neue Executor kann Eintraege aufloesen, die bisher uebersprungen
		// wurden, weil der Store noch nicht importiert war.
		if ((this.offenProTabelle.get(table) ?? 0) > 0) void this.replay();
	}

	private merken(table: string, delta: number) {
		const naechster = Math.max(0, (this.offenProTabelle.get(table) ?? 0) + delta);
		if (naechster === 0) this.offenProTabelle.delete(table);
		else this.offenProTabelle.set(table, naechster);
		this.pending = Math.max(0, this.pending + delta);
	}

	async enqueue(mutation: Omit<Mutation, 'seq' | 'createdAt' | 'attempts'>) {
		const db = await openDb();
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).add({
			...mutation,
			createdAt: new Date().toISOString(),
			attempts: 0
		});
		await txDone(tx);
		this.merken(mutation.table, 1);
		void this.replay();
	}

	/** Wartende Mutationen in Einfuegereihenfolge (Auto-Increment-Schluessel). */
	async getAll(): Promise<Mutation[]> {
		const db = await openDb();
		const tx = db.transaction(STORE_NAME, 'readonly');
		return req(tx.objectStore(STORE_NAME).getAll() as IDBRequest<Mutation[]>);
	}

	async getDead(): Promise<Mutation[]> {
		const db = await openDb();
		const tx = db.transaction(DEAD_STORE, 'readonly');
		return req(tx.objectStore(DEAD_STORE).getAll() as IDBRequest<Mutation[]>);
	}

	async remove(seq: number) {
		const db = await openDb();
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).delete(seq);
		await txDone(tx);
	}

	async clear() {
		const db = await openDb();
		const tx = db.transaction([STORE_NAME, DEAD_STORE], 'readwrite');
		tx.objectStore(STORE_NAME).clear();
		tx.objectStore(DEAD_STORE).clear();
		await txDone(tx);
		this.offenProTabelle.clear();
		this.pending = 0;
		this.dead = 0;
	}

	/** Nur den Dead-Letter-Store leeren (Nutzer quittiert die Verluste). */
	async clearDead() {
		const db = await openDb();
		const tx = db.transaction(DEAD_STORE, 'readwrite');
		tx.objectStore(DEAD_STORE).clear();
		await txDone(tx);
		this.dead = 0;
	}

	/** Zaehler aus der DB auffrischen (App-Start). */
	async refreshCounts() {
		try {
			const wartend = await this.getAll();
			this.uebernehmeStand(wartend);
			this.dead = (await this.getDead()).length;
		} catch {
			// IndexedDB nicht verfuegbar (z. B. Privatmodus) — Zaehler bleiben unveraendert.
		}
	}

	private uebernehmeStand(wartend: Mutation[]) {
		this.offenProTabelle.clear();
		for (const m of wartend) {
			this.offenProTabelle.set(m.table, (this.offenProTabelle.get(m.table) ?? 0) + 1);
		}
		this.pending = wartend.length;
	}

	private async insDeadLetter(mutation: Mutation, grund: string) {
		const db = await openDb();
		const tx = db.transaction([STORE_NAME, DEAD_STORE], 'readwrite');
		const { seq, ...rest } = mutation;
		tx.objectStore(DEAD_STORE).add({ ...rest, lastError: grund });
		tx.objectStore(STORE_NAME).delete(seq!);
		await txDone(tx);
		this.dead += 1;
		this.merken(mutation.table, -1);
	}

	/** Dead Letter fuer eine Mutation, die nie in der Queue war (siehe runOrQueue). */
	private async direktInsDeadLetter(
		mutation: Omit<Mutation, 'seq' | 'createdAt' | 'attempts'>,
		grund: string
	) {
		const db = await openDb();
		const tx = db.transaction(DEAD_STORE, 'readwrite');
		tx.objectStore(DEAD_STORE).add({
			...mutation,
			createdAt: new Date().toISOString(),
			attempts: 1,
			lastError: grund
		});
		await txDone(tx);
		this.dead += 1;
	}

	private async zaehleVersuch(mutation: Mutation, grund: string) {
		const db = await openDb();
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).put({
			...mutation,
			attempts: mutation.attempts + 1,
			lastError: grund
		});
		await txDone(tx);
	}

	/**
	 * Spielt die Queue in Einfuegereihenfolge ab. Ein Fehler bricht den Durchlauf
	 * NICHT ab — sonst blockiert eine unzustellbare Mutation alle spaeteren.
	 * Die Reihenfolge bleibt trotzdem gewahrt: scheitert ein Eintrag, wird der
	 * Rest DERSELBEN Tabelle uebersprungen, damit kein Update vor seinem Insert
	 * landet. Andere Tabellen laufen weiter.
	 */
	async replay(): Promise<void> {
		if (typeof navigator !== 'undefined' && !navigator.onLine) return;

		// Laeuft schon einer, erst abwarten — sonst kaeme der Aufrufer zurueck,
		// bevor irgendetwas geschrieben wurde. Danach ein eigener Durchlauf:
		// waehrenddessen koennen neue Mutationen dazugekommen sein.
		while (this.laufend) await this.laufend;

		this.laufend = this.durchlauf().finally(() => (this.laufend = null));
		return this.laufend;
	}

	private async durchlauf(): Promise<void> {
		let fehler = false;
		try {
			const mutations = await this.getAll();
			this.uebernehmeStand(mutations);
			if (mutations.length === 0) {
				// replay() laeuft bei jedem enqueue(), jedem online-Event und jeder
				// Executor-Registrierung — meist ohne dass etwas wartet. Ohne diesen
				// fruehen Ausstieg blitzte das Sync-Banner bei jedem dieser Aufrufe kurz
				// blau auf, obwohl es nichts zu synchronisieren gab (siehe Bug-Report:
				// "Synchronisiere..."-Leiste flackert staendig).
				this.status = 'idle';
				return;
			}

			this.status = 'syncing';
			const blockiert = new Set<string>();

			for (const mutation of mutations) {
				if (blockiert.has(mutation.table)) continue;

				const fn = this.executors.get(mutation.table)?.[mutation.operation];
				if (!fn) {
					// Store noch nicht importiert -> Executor fehlt. Kein Fehlversuch,
					// aber Tabelle sperren, damit die Reihenfolge haelt.
					blockiert.add(mutation.table);
					fehler = true;
					continue;
				}

				try {
					await fn(mutation.payload);
					await this.remove(mutation.seq!);
					this.merken(mutation.table, -1);
				} catch (err) {
					const grund = fehlertext(err);
					fehler = true;
					blockiert.add(mutation.table);
					if (istDauerhaft(err) || mutation.attempts + 1 >= MAX_ATTEMPTS) {
						await this.insDeadLetter(mutation, grund);
					} else {
						await this.zaehleVersuch(mutation, grund);
					}
				}
			}
			this.status = fehler ? 'error' : 'idle';
		} catch {
			this.status = 'error';
		}
	}

	/**
	 * Fuehrt `apiFn` direkt aus, wenn online; sonst (oder bei Fehler mitten im
	 * Request) landet `payload` in der Queue.
	 *
	 * Wartet fuer DIESE Tabelle bereits etwas, wird nicht direkt geschrieben —
	 * sonst ueberholt die neue Mutation ihre eigenen Vorgaenger.
	 */
	async runOrQueue<T>(
		table: string,
		operation: Mutation['operation'],
		payload: unknown,
		apiFn: () => Promise<T>
	): Promise<T | undefined> {
		const wartetSchon = (this.offenProTabelle.get(table) ?? 0) > 0;
		if (navigator.onLine && !wartetSchon) {
			try {
				return await apiFn();
			} catch (err) {
				// Ein fachlicher Fehler (RLS, Constraint) wird durch Warten nicht
				// besser. Frueher landete er trotzdem in der Queue, blockierte dort
				// fuenf Durchlaeufe lang alle spaeteren Aenderungen derselben Tabelle
				// und tauchte erst danach im Banner auf.
				if (istDauerhaft(err)) {
					await this.direktInsDeadLetter({ table, operation, payload }, fehlertext(err));
					this.status = 'error';
					return undefined;
				}
				await this.enqueue({ table, operation, payload });
				return undefined;
			}
		}
		await this.enqueue({ table, operation, payload });
		return undefined;
	}
}

export const outbox = new Outbox();
