import type { LifeEventMap, LifeEventType } from '#lib/config/ereignisse.js';

export interface Ursache {
	art: 'nutzer' | 'automation';
	/** gesetzt bei art = 'automation' */
	regelId?: string;
	/** Nutzer = 0, jede Automation +1 */
	tiefe: number;
}
export interface LifeEvent<T extends LifeEventType = LifeEventType> {
	typ: T;
	daten: LifeEventMap[T];
	zeit: string;
	ursache: Ursache;
}
type Handler<T extends LifeEventType> = (e: LifeEvent<T>) => void | Promise<void>;

/** Ab dieser Tiefe wird nicht mehr zugestellt — schützt vor Regel-Ping-Pong. */
export const MAX_TIEFE = 3;
export const NUTZER: Ursache = { art: 'nutzer', tiefe: 0 };

const handler = new Map<LifeEventType, Set<Handler<LifeEventType>>>();

export function on<T extends LifeEventType>(typ: T, fn: Handler<T>): () => void {
	const set = handler.get(typ) ?? new Set<Handler<LifeEventType>>();
	set.add(fn as unknown as Handler<LifeEventType>);
	handler.set(typ, set);
	return () => void set.delete(fn as unknown as Handler<LifeEventType>);
}

/**
 * Meldet ein Ereignis. Zustellung asynchron (Microtask); ein fehlschlagender Handler
 * erreicht weder den Aufrufer noch andere Handler.
 *
 * NUR aus lokalen Nutzeraktionen oder Automationen aufrufen — NIE aus Realtime-
 * Handlern, sonst läuft jede Automation einmal je offenem Gerät.
 */
export function emit<T extends LifeEventType>(
	typ: T,
	daten: LifeEventMap[T],
	ursache: Ursache = NUTZER
): void {
	if (ursache.tiefe >= MAX_TIEFE) {
		console.warn('[ereignisse] Kette abgebrochen', typ, ursache);
		return;
	}
	const fns = handler.get(typ);
	if (!fns || fns.size === 0) return;
	const ereignis = {
		typ,
		daten,
		zeit: new Date().toISOString(),
		ursache
	} as LifeEvent<LifeEventType>;
	for (const fn of [...fns]) {
		queueMicrotask(() => {
			Promise.resolve()
				.then(() => fn(ereignis))
				.catch((err) => console.error('[ereignisse] Handler fehlgeschlagen', typ, err));
		});
	}
}

/** Nur für Tests. */
export function _alleHandlerEntfernen(): void {
	handler.clear();
}
