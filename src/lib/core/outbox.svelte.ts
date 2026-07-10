interface Mutation {
	id: string;
	table: string;
	operation: 'insert' | 'update' | 'delete';
	payload: unknown;
	createdAt: string;
}

interface Executor {
	insert?: (payload: unknown) => Promise<unknown>;
	update?: (payload: unknown) => Promise<unknown>;
	delete?: (payload: unknown) => Promise<unknown>;
}

const DB_NAME = 'lifeos-outbox';
const STORE_NAME = 'mutations';

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function txDone(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

class Outbox {
	status = $state<'idle' | 'syncing' | 'error'>('idle');
	private executors = new Map<string, Executor>();

	registerExecutor(table: string, executor: Executor) {
		this.executors.set(table, executor);
	}

	async enqueue(mutation: Omit<Mutation, 'id' | 'createdAt'>) {
		const db = await openDb();
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const full: Mutation = {
			...mutation,
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString()
		};
		tx.objectStore(STORE_NAME).add(full);
		await txDone(tx);
		void this.replay();
	}

	async getAll(): Promise<Mutation[]> {
		const db = await openDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const req = tx.objectStore(STORE_NAME).getAll();
			req.onsuccess = () => resolve(req.result as Mutation[]);
			req.onerror = () => reject(req.error);
		});
	}

	async remove(id: string) {
		const db = await openDb();
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).delete(id);
		await txDone(tx);
	}

	async clear() {
		const db = await openDb();
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).clear();
		await txDone(tx);
	}

	async replay() {
		if (!navigator.onLine) return;
		this.status = 'syncing';
		try {
			const mutations = await this.getAll();
			for (const mutation of mutations) {
				const fn = this.executors.get(mutation.table)?.[mutation.operation];
				if (!fn) continue;
				await fn(mutation.payload);
				await this.remove(mutation.id);
			}
			this.status = 'idle';
		} catch {
			this.status = 'error';
		}
	}

	/**
	 * Runs `apiFn` immediately when online; queues `payload` for replay when
	 * offline or when `apiFn` fails (e.g. dropped connection mid-request).
	 */
	async runOrQueue<T>(
		table: string,
		operation: Mutation['operation'],
		payload: unknown,
		apiFn: () => Promise<T>
	): Promise<T | undefined> {
		if (navigator.onLine) {
			try {
				return await apiFn();
			} catch {
				await this.enqueue({ table, operation, payload });
				return undefined;
			}
		}
		await this.enqueue({ table, operation, payload });
		return undefined;
	}
}

export const outbox = new Outbox();
