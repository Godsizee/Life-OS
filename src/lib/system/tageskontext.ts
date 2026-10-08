import { fromISODate } from '#lib/core/date.js';
import { aktiveModule } from './module-aktiv.svelte.js';

/** Grundform von `DayContext` (goals/types.ts): Jede Zahl, die kein Modul liefert, bleibt 0 bzw. leer. */
const LEER = {
	tasks_done: 0,
	tasks_total: 0,
	habits_logged: 0,
	habits_due: 0,
	workout: false,
	mood: null as number | null,
	mood_activities: [] as string[],
	sleep_h: null as number | null,
	water_ml: null as number | null,
	focus_minutes: 0
};

/**
 * „Tag in Zahlen“ für einen Tag ('yyyy-mm-dd'): Die eingeschalteten Module liefern ihre Teile, hier werden
 * sie zusammengefügt. Die Form entspricht `DayContext`, weil gespeicherte Tagebuch-Schnappschüsse sie nutzen.
 */
export function baueTageskontext(datum: string) {
	// Ungültiges Datum (Falle F8) liefert den leeren Kontext statt eines Rechenfehlers.
	const gueltig = fromISODate(datum) !== null;
	const teile = gueltig
		? aktiveModule.liste.map((m) => {
				try {
					return m.tageskontext?.(datum) ?? {};
				} catch (err) {
					console.error(`[tageskontext] ${m.id} fehlgeschlagen`, err);
					return {};
				}
			})
		: [];
	return Object.assign({ ...LEER, date: datum }, ...teile) as typeof LEER & { date: string };
}
