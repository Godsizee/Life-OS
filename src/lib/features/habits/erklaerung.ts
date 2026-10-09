import type { Erklaerung } from '#lib/core/modul.js';
import type { Pause } from '#lib/core/ruhe.js';
import { bestStreak, calculateStreak, streakLabel, type HabitCore, type HabitDay } from './streak';

const tag = (iso: string) => iso.split('-').reverse().slice(0, 2).join('.') + '.';

const GRUND: Record<Pause['grund'], string> = {
	urlaub: 'Urlaub',
	krank: 'Krank',
	abwesend: 'Abwesend',
	sonstiges: 'Pause'
};

/** „Warum diese Serie?“: Welche Tage zählen, wie Überspringen und Pausen wirken. Rein und testbar. */
export function serieErklaerung(
	habit: HabitCore,
	tage: HabitDay[],
	pausen: Pause[],
	heute: Date = new Date()
): Erklaerung {
	const woechentlich = habit.schedule.type === 'weekly_count';
	const einheit = woechentlich ? 'Wochen' : 'Tage';
	const serie = calculateStreak(habit, tage, heute);
	const beste = bestStreak(habit, tage, heute);
	const daten = [
		woechentlich
			? `Zählweise: Eine Woche zählt, wenn die Routine ${habit.schedule.type === 'weekly_count' ? habit.schedule.times : 0}-mal erledigt ist.`
			: 'Zählweise: Jeder fällige und erledigte Tag zählt. Tage ohne Fälligkeit zählen nicht und unterbrechen nicht.',
		woechentlich
			? 'Die laufende Woche darf noch offen sein.'
			: 'Heute darf noch offen sein, ohne die Serie zu unterbrechen.',
		'Übersprungene Tage halten die Serie, zählen aber nicht als erledigt.',
		`Beste Serie: ${streakLabel(habit.schedule, beste)}`
	];
	if (pausen.length > 0) {
		daten.push(
			`Pausen: ${pausen.map((p) => `${tag(p.von)}–${tag(p.bis)} (${GRUND[p.grund]})`).join(', ')}. Pausentage wirken wie Überspringen.`
		);
	}
	return {
		was: `Die Serie zählt ${einheit} am Stück, in denen die Routine erledigt wurde.`,
		warumJetzt: `Aktuell ${streakLabel(habit.schedule, serie)}.`,
		daten,
		staerke: 'Eine Lücke ist kein Scheitern: Überspringen und Pausen halten die Serie.',
		steuerung: []
	};
}
