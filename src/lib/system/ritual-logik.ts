import { fromISODate, toISODate } from '#lib/core/date.js';
import { weekKey } from '#lib/features/analytics/week-window.js';
import { istOffen } from '#lib/features/tasks/status.js';
import type { Task } from '#lib/features/tasks/types.js';
import { imEingang } from '#lib/features/tasks/utils.js';

export type KandidatGrund = 'geplant' | 'frist-vorbei' | 'frist-bald' | 'wochenfokus' | 'eingang';

export interface Kandidat {
	task: Task;
	grund: KandidatGrund;
	/** Klartext für die Zeile, ohne Wertung. */
	text: string;
}

const TEXT: Record<KandidatGrund, string> = {
	geplant: 'Für heute geplant',
	'frist-vorbei': 'Frist vorbei — heute angehen oder neu planen?',
	'frist-bald': 'Frist in den nächsten 2 Tagen',
	wochenfokus: 'Wochenfokus',
	eingang: 'Im Eingang'
};

const REIHENFOLGE: KandidatGrund[] = [
	'geplant',
	'frist-vorbei',
	'frist-bald',
	'wochenfokus',
	'eingang'
];

const lokalerTag = (iso: string) => toISODate(new Date(iso));

function tagPlus(tag: Date, tage: number): string {
	return toISODate(new Date(tag.getFullYear(), tag.getMonth(), tag.getDate() + tage));
}

/**
 * Kandidaten für „Tag planen“, jede Aufgabe einmal mit dem stärksten Grund:
 * für heute geplant > Frist vorbei > Frist in ≤ 2 Tagen > Wochenfokus > Eingang.
 */
export function planKandidaten(tasks: Task[], jetzt: Date): Kandidat[] {
	const heute = toISODate(jetzt);
	const spaetestens = tagPlus(jetzt, 2);
	const woche = weekKey(jetzt);

	const grundVon = (t: Task): KandidatGrund | null => {
		if (t.planned_for === heute) return 'geplant';
		const frist = t.due_at ? lokalerTag(t.due_at) : null;
		if (frist && frist < heute) return 'frist-vorbei';
		if (frist && frist <= spaetestens) return 'frist-bald';
		if (t.focus_week === woche) return 'wochenfokus';
		if (imEingang(t)) return 'eingang';
		return null;
	};

	const treffer: Kandidat[] = [];
	for (const task of tasks) {
		if (!istOffen(task)) continue;
		const grund = grundVon(task);
		if (grund) treffer.push({ task, grund, text: TEXT[grund] });
	}
	return treffer.sort(
		(a, b) =>
			REIHENFOLGE.indexOf(a.grund) - REIHENFOLGE.indexOf(b.grund) ||
			a.task.position - b.task.position
	);
}

/** Offene Aufgaben, die gestern geplant waren (Schritt „Gestern“ in „Tag planen“). */
export function gesternOffen(tasks: Task[], jetzt: Date): Task[] {
	const gestern = tagPlus(jetzt, -1);
	return tasks.filter((t) => istOffen(t) && t.planned_for === gestern);
}

/** Offene Aufgaben, die heute geplant oder heute fällig sind (Schritt „Offen“ in „Tag abschließen“). */
export function heuteOffen(tasks: Task[], jetzt: Date): Task[] {
	const heute = toISODate(jetzt);
	return tasks.filter(
		(t) =>
			istOffen(t) && (t.planned_for === heute || (!!t.due_at && lokalerTag(t.due_at) === heute))
	);
}

/** Vorschläge für morgen: offen, noch nicht für morgen geplant, Frist bald oder Wochenfokus, dann Eingang. Höchstens `max`. */
export function fuerMorgen(tasks: Task[], jetzt: Date, max = 6): Task[] {
	const morgen = tagPlus(jetzt, 1);
	const grenze = tagPlus(jetzt, 3);
	const woche = weekKey(jetzt);
	const frei = tasks.filter((t) => istOffen(t) && t.planned_for !== morgen);
	const dringend = frei.filter(
		(t) => (!!t.due_at && lokalerTag(t.due_at) <= grenze) || t.focus_week === woche
	);
	const rest = frei.filter((t) => !dringend.includes(t) && imEingang(t));
	return [...dringend, ...rest].slice(0, max);
}

/** Datum des Tages vor `datum` (yyyy-mm-dd). */
export function vortag(datum: string): string | null {
	const d = fromISODate(datum);
	return d ? tagPlus(d, -1) : null;
}
