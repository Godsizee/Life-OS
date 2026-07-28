// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { outbox } from './outbox.svelte';

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
