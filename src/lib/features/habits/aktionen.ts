import { toISODate } from '#lib/core/date.js';
import { herkunftVon, type Ursache } from '#lib/core/ereignisse.js';
import type { AktionDef, AktionErgebnis } from '#lib/core/modul.js';
import { routineNachName } from './routine-name.js';
import { habitsState } from './store.svelte.js';
import { isCompleted } from './streak.js';
import type { HabitLog } from './types.js';

const text = (v: unknown): string => (typeof v === 'string' ? v : '');
const heute = () => toISODate(new Date());

/** Stellt einen Tag so wieder her, wie er vor der Automation war (Eintrag oder „nichts"). */
async function stelleTagWiederHer(habitId: string, datum: string, vorher: HabitLog | undefined) {
	if (vorher) {
		await habitsState.writeDay(
			habitId,
			datum,
			vorher.value === null ? 0 : Number(vorher.value),
			vorher.status,
			vorher.source ?? 'manual'
		);
	} else {
		await habitsState.writeDay(habitId, datum, 0, 'done'); // Wert 0 löscht die Zeile
	}
}

async function abhaken(habitId: string, datum: string, ursache: Ursache): Promise<AktionErgebnis> {
	const habit = habitsState.habits.find((h) => h.id === habitId);
	if (!habit) return { geaendert: false, beschreibung: 'Routine nicht gefunden oder archiviert' };

	const tag = habitsState.entriesFor(habitId).find((d) => d.date === datum);
	if (isCompleted(habit, tag)) {
		return { geaendert: false, beschreibung: `Routine „${habit.name}" war schon abgehakt` };
	}

	const vorher = habitsState.logAm(habitId, datum);
	await habitsState.writeDay(
		habitId,
		datum,
		habitsState.targetOf(habitId),
		'done',
		herkunftVon(ursache),
		ursache
	);
	return {
		geaendert: true,
		beschreibung: `Routine „${habit.name}" für ${datum === heute() ? 'heute' : datum} abgehakt`,
		rueckgaengig: () => stelleTagWiederHer(habitId, datum, vorher)
	};
}

export const habitsAktionen: Record<string, AktionDef> = {
	'habits.abhaken': {
		titel: 'Routine abhaken',
		ausfuehren: (p, ursache) => abhaken(text(p.habitId), text(p.datum) || heute(), ursache)
	},

	'habits.abhakenNachName': {
		titel: 'Gleichnamige Routine abhaken',
		ausfuehren: async (p, ursache) => {
			const habit = routineNachName(habitsState.habits, text(p.name));
			if (!habit) return { geaendert: false, beschreibung: 'Keine Routine mit diesem Namen' };
			return abhaken(habit.id, text(p.datum) || heute(), ursache);
		}
	},

	'habits.mengeErhoehen': {
		titel: 'Mengen-Routine erhöhen',
		ausfuehren: async (p, ursache) => {
			const habit = habitsState.habits.find((h) => h.id === text(p.habitId));
			const menge = Number(p.menge);
			if (!habit || !Number.isFinite(menge) || menge <= 0) {
				return { geaendert: false, beschreibung: 'Routine nicht gefunden oder Menge ungültig' };
			}
			const datum = heute();
			const ziel = habitsState.targetOf(habit.id);
			const aktuell = habitsState.isSkippedToday(habit.id) ? 0 : habitsState.valueToday(habit.id);
			const neu = Math.min(ziel, aktuell + menge);
			if (neu <= aktuell) {
				return {
					geaendert: false,
					beschreibung: `Routine „${habit.name}" hat das Ziel schon erreicht`
				};
			}
			const vorher = habitsState.logAm(habit.id, datum);
			await habitsState.writeDay(habit.id, datum, neu, 'done', herkunftVon(ursache), ursache);
			return {
				geaendert: true,
				beschreibung: `Routine „${habit.name}" um ${neu - aktuell} erhöht (${neu} von ${ziel})`,
				// Zurück auf den Stand davor — bei gedeckelter Menge wäre „minus menge" zu viel.
				rueckgaengig: () => stelleTagWiederHer(habit.id, datum, vorher)
			};
		}
	}
};
