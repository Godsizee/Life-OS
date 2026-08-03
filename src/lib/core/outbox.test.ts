// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { istDauerhaft, outbox } from './outbox.svelte';

/**
 * Die Outbox ist ein Singleton. Zwischen den Tests reicht clear() — die
 * Auto-Increment-Sequenz laeuft weiter, das ist fuer die Reihenfolge egal.
 */
beforeEach(async () => {
	Object.defineProperty(globalThis, 'navigator', {
		value: { onLine: true },
		configurable: true,
		writable: true
	});
	await outbox.clear();
});

function setOnline(online: boolean) {
	(globalThis.navigator as unknown as { onLine: boolean }).onLine = online;
}

describe('Reihenfolge', () => {
	it('spielt Mutationen in Einfuegereihenfolge ab, nicht in Schluesselreihenfolge', async () => {
		const gesehen: string[] = [];
		outbox.registerExecutor('tasks', {
			insert: async (p) => void gesehen.push(`insert:${(p as { id: string }).id}`),
			update: async (p) => void gesehen.push(`update:${(p as { id: string }).id}`),
			delete: async (p) => void gesehen.push(`delete:${(p as { id: string }).id}`)
		});

		setOnline(false);
		await outbox.enqueue({ table: 'tasks', operation: 'insert', payload: { id: 'a' } });
		await outbox.enqueue({ table: 'tasks', operation: 'update', payload: { id: 'a' } });
		await outbox.enqueue({ table: 'tasks', operation: 'delete', payload: { id: 'a' } });

		setOnline(true);
		await outbox.replay();

		// v1 nutzte crypto.randomUUID() als Schluessel — getAll() lieferte damit eine
		// zufaellige Reihenfolge und ein Update konnte vor seinem Insert laufen.
		expect(gesehen).toEqual(['insert:a', 'update:a', 'delete:a']);
		expect(outbox.pending).toBe(0);
	});

	it('schreibt nicht direkt, solange fuer dieselbe Tabelle etwas wartet', async () => {
		const gesehen: string[] = [];
		outbox.registerExecutor('tasks', {
			insert: async (p) => void gesehen.push(`insert:${(p as { id: string }).id}`),
			update: async (p) => void gesehen.push(`update:${(p as { id: string }).id}`)
		});

		setOnline(false);
		await outbox.enqueue({ table: 'tasks', operation: 'insert', payload: { id: 'a' } });

		// Wieder online, aber die Queue ist nicht leer: das Update muss sich
		// einreihen, statt seinen eigenen Insert zu ueberholen.
		setOnline(true);
		const direkt: string[] = [];
		await outbox.runOrQueue('tasks', 'update', { id: 'a' }, async () => {
			direkt.push('direkt');
		});
		expect(direkt).toEqual([]);

		await outbox.replay();
		expect(gesehen).toEqual(['insert:a', 'update:a']);
	});
});

describe('Dead Letter', () => {
	it('sortiert eine dauerhaft scheiternde Mutation nach MAX_ATTEMPTS aus', async () => {
		outbox.registerExecutor('notes', {
			insert: async () => {
				throw new Error('constraint violation');
			}
		});

		setOnline(false);
		await outbox.enqueue({ table: 'notes', operation: 'insert', payload: { id: 'kaputt' } });
		setOnline(true);

		for (let i = 0; i < 5; i++) await outbox.replay();

		expect(outbox.dead).toBe(1);
		expect(outbox.pending).toBe(0);
		expect(outbox.status).toBe('error');

		const tot = await outbox.getDead();
		expect(tot).toHaveLength(1);
		expect(tot[0].lastError).toContain('constraint violation');
	});

	it('blockiert nur die betroffene Tabelle, andere laufen weiter', async () => {
		const geschrieben: string[] = [];
		outbox.registerExecutor('notes', {
			insert: async () => {
				throw new Error('kaputt');
			}
		});
		outbox.registerExecutor('habits', {
			insert: async (p) => void geschrieben.push((p as { id: string }).id)
		});

		setOnline(false);
		await outbox.enqueue({ table: 'notes', operation: 'insert', payload: { id: 'n1' } });
		await outbox.enqueue({ table: 'habits', operation: 'insert', payload: { id: 'h1' } });
		setOnline(true);

		await outbox.replay();

		// Vorher lag der try/catch AUSSERHALB der Schleife: der erste Fehler brach
		// den Durchlauf ab und alle spaeteren Mutationen blieben fuer immer liegen.
		expect(geschrieben).toEqual(['h1']);
	});

	it('sperrt nach einem Fehler den Rest DERSELBEN Tabelle', async () => {
		const geschrieben: string[] = [];
		let ersterAufruf = true;
		outbox.registerExecutor('tasks', {
			insert: async (p) => {
				if (ersterAufruf) {
					ersterAufruf = false;
					throw new Error('Netz weg');
				}
				geschrieben.push((p as { id: string }).id);
			}
		});

		setOnline(false);
		await outbox.enqueue({ table: 'tasks', operation: 'insert', payload: { id: 't1' } });
		await outbox.enqueue({ table: 'tasks', operation: 'insert', payload: { id: 't2' } });
		setOnline(true);

		await outbox.replay();
		expect(geschrieben).toEqual([]); // t2 darf t1 nicht ueberholen

		await outbox.replay();
		expect(geschrieben).toEqual(['t1', 't2']);
	});
});

describe('Executor fehlt', () => {
	it('laesst die Mutation liegen, ohne einen Fehlversuch zu zaehlen', async () => {
		setOnline(false);
		await outbox.enqueue({ table: 'unbekannt', operation: 'insert', payload: { id: 'x' } });
		setOnline(true);

		// Store noch nicht importiert -> kein Executor. Nach zehn Laeufen darf die
		// Zeile weder im Dead Letter liegen noch verschwunden sein.
		for (let i = 0; i < 10; i++) await outbox.replay();

		expect(outbox.dead).toBe(0);
		expect(outbox.pending).toBe(1);

		const wartend = await outbox.getAll();
		expect(wartend[0].attempts).toBe(0);
	});
});

describe('offline', () => {
	it('spielt offline nichts ab', async () => {
		const gesehen: string[] = [];
		outbox.registerExecutor('tasks', {
			insert: async (p) => void gesehen.push((p as { id: string }).id)
		});

		setOnline(false);
		await outbox.enqueue({ table: 'tasks', operation: 'insert', payload: { id: 'a' } });
		await outbox.replay();

		expect(gesehen).toEqual([]);
		expect(outbox.pending).toBe(1);
	});
});

describe('istDauerhaft', () => {
	it('erkennt Integritaetsverletzungen (SQLSTATE 23xxx)', () => {
		expect(istDauerhaft({ code: '23505' })).toBe(true); // unique_violation
		expect(istDauerhaft({ code: '23503' })).toBe(true); // foreign_key_violation
		expect(istDauerhaft({ code: '23502' })).toBe(true); // not_null_violation
	});

	it('erkennt eine RLS-Ablehnung (SQLSTATE 42501)', () => {
		expect(istDauerhaft({ code: '42501' })).toBe(true);
	});

	it('erkennt fachliche 4xx-Antworten', () => {
		expect(istDauerhaft({ status: 400 })).toBe(true);
		expect(istDauerhaft({ status: 404 })).toBe(true);
		expect(istDauerhaft({ status: 422 })).toBe(true);
	});

	it('behandelt 408 und 429 weiter als wiederholbar', () => {
		expect(istDauerhaft({ status: 408 })).toBe(false);
		expect(istDauerhaft({ status: 429 })).toBe(false);
	});

	it('behandelt 401/403 als wiederholbar — ein Token-Refresh kann sie loesen', () => {
		expect(istDauerhaft({ status: 401 })).toBe(false);
		expect(istDauerhaft({ status: 403 })).toBe(false);
	});

	it('behandelt Serverfehler und Netzfehler als wiederholbar', () => {
		expect(istDauerhaft({ status: 500 })).toBe(false);
		expect(istDauerhaft({ status: 503 })).toBe(false);
		expect(istDauerhaft(new TypeError('Failed to fetch'))).toBe(false);
		expect(istDauerhaft(null)).toBe(false);
		expect(istDauerhaft('kaputt')).toBe(false);
	});
});

describe('Dead Letter bei dauerhaften Fehlern', () => {
	it('sortiert sofort aus, statt fuenfmal vergeblich zu versuchen', async () => {
		let versuche = 0;
		outbox.registerExecutor('notes', {
			insert: async () => {
				versuche++;
				throw { code: '42501', message: 'new row violates row-level security policy' };
			}
		});

		setOnline(false);
		await outbox.enqueue({ table: 'notes', operation: 'insert', payload: { id: 'rls' } });
		setOnline(true);
		await outbox.replay();

		// Vorher lief das fuenf Durchlaeufe lang und blockierte dabei jedes Mal alle
		// spaeteren Aenderungen derselben Tabelle.
		expect(versuche).toBe(1);
		expect(outbox.dead).toBe(1);
		expect(outbox.pending).toBe(0);
	});

	it('legt einen dauerhaft gescheiterten Direktschreibvorgang gleich ins Dead Letter', async () => {
		const ergebnis = await outbox.runOrQueue('tasks', 'insert', { id: 'x' }, async () => {
			throw { code: '23505', message: 'duplicate key value' };
		});

		expect(ergebnis).toBeUndefined();
		// Nicht in die Queue: dort haette er nur gewartet, um dann doch zu scheitern.
		expect(outbox.pending).toBe(0);
		expect(outbox.dead).toBe(1);
		expect(outbox.status).toBe('error');

		const tot = await outbox.getDead();
		expect(tot[0].table).toBe('tasks');
		expect(tot[0].lastError).toContain('duplicate key');
	});

	it('stellt einen Netzfehler beim Direktschreiben weiterhin in die Queue', async () => {
		const ergebnis = await outbox.runOrQueue('tasks', 'insert', { id: 'y' }, async () => {
			throw new TypeError('Failed to fetch');
		});

		expect(ergebnis).toBeUndefined();
		expect(outbox.dead).toBe(0);
		expect(outbox.pending).toBe(1);
	});
});
