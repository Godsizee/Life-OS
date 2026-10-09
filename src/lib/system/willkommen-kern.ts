import { fromISODate, toISODate } from '#lib/core/date.js';
import type { Pause } from '#lib/core/ruhe.js';
import { istOffen } from '#lib/features/tasks/status.js';
import type { Task } from '#lib/features/tasks/types.js';

const TAG_MS = 24 * 60 * 60 * 1000;

function tagPlus(datum: string, tage: number): string | null {
	const d = fromISODate(datum);
	return d ? toISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + tage)) : null;
}

/** Ganze Kalendertage zwischen zwei 'yyyy-mm-dd'-Daten; leer oder ungültig → null. */
export function tageWeg(zuletzt: string, heute: string): number | null {
	const a = fromISODate(zuletzt);
	const b = fromISODate(heute);
	if (!a || !b) return null;
	// Rundung statt Division: Sommerzeitwechsel macht aus 1 Tag 23 oder 25 Stunden.
	return Math.round((b.getTime() - a.getTime()) / TAG_MS);
}

export function zeigeWillkommen(zuletzt: string, heute: string, schwelle: number): boolean {
	const weg = tageWeg(zuletzt, heute);
	return weg !== null && weg >= schwelle;
}

/** Pause vom Tag nach der letzten Aktivität bis gestern; null, wenn dazwischen kein Tag liegt. */
export function pauseNachtragen(zuletzt: string, heute: string): Pause | null {
	const von = tagPlus(zuletzt, 1);
	const bis = tagPlus(heute, -1);
	return von && bis && von <= bis ? { von, bis, grund: 'abwesend' } : null;
}

/** Offene Aufgaben mit einem Plan für einen früheren Tag: „Neu starten“ nimmt sie vom Plan. */
export function alteKlaerungen(tasks: Task[], heute: string): Task[] {
	return tasks.filter((t) => istOffen(t) && !!t.planned_for && t.planned_for < heute);
}

/** Offene Aufgaben, deren Frist vor `heute` lag (lokaler Tag der Frist). */
export function fristenVorbei(tasks: Task[], heute: string): Task[] {
	return tasks
		.filter((t) => istOffen(t) && !!t.due_at && toISODate(new Date(t.due_at)) < heute)
		.sort((a, b) => (a.due_at ?? '').localeCompare(b.due_at ?? ''));
}

/** Offene Aufgaben ohne Plan für heute oder später: Text „Es warten N Aufgaben ohne Plan“, nie als Versäumnis gezählt. */
export function ohnePlan(tasks: Task[], heute: string): number {
	return tasks.filter((t) => istOffen(t) && (!t.planned_for || t.planned_for < heute)).length;
}

/** Frist ohne Uhrzeit = Tagesende in lokaler Zeit (wie die Schnell-Erfassung). */
export function fristAmTag(datum: string): string {
	return new Date(`${datum}T23:59:00`).toISOString();
}
