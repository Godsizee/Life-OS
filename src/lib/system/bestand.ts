import { toISODate } from '#lib/core/date.js';
import { calendarState } from '#lib/features/calendar/store.svelte.js';
import { fitnessState } from '#lib/features/fitness/store.svelte.js';
import { goalsState } from '#lib/features/goals/store.svelte.js';
import { habitsState } from '#lib/features/habits/store.svelte.js';
import { healthState } from '#lib/features/health/store.svelte.js';
import { moodState } from '#lib/features/mood/store.svelte.js';
import { notesState } from '#lib/features/notes/store.svelte.js';
import { profileState } from '#lib/features/profile/store.svelte.js';
import { shoppingState } from '#lib/features/shopping/store.svelte.js';
import { tasksState } from '#lib/features/tasks/store.svelte.js';
import { bestandsPatch } from './bestand-logik.js';

/**
 * Bestandskonten behalten nach dem Update alle Module (T203). Läuft nach `ladeAlles()` und nur auf
 * vollständig geladenen Daten: Ein fehlgeschlagener Ladevorgang sähe sonst wie „Konto ohne Daten“ aus,
 * und die Übernahme fiele für immer aus. `system` darf mehrere Stores lesen — Features dürfen es nicht.
 * Liefert `true`, wenn die Prüfung auf vollständigen Daten lief (nur dann darf der Setup-Assistent entscheiden).
 */
export async function uebernehmeBestand(): Promise<boolean> {
	try {
		const stores = [
			profileState,
			tasksState,
			notesState,
			habitsState,
			goalsState,
			calendarState,
			shoppingState,
			moodState,
			healthState,
			fitnessState
		];
		if (!stores.every((s) => s.loaded)) return false;
		const anzahl =
			tasksState.tasks.length +
			notesState.notes.length +
			habitsState.habits.length +
			goalsState.goals.length +
			calendarState.events.length +
			shoppingState.items.length +
			moodState.entries.length +
			healthState.entries.length +
			fitnessState.plans.length +
			fitnessState.logs.length;
		const patch = bestandsPatch(profileState.settings, anzahl > 0, toISODate(new Date()));
		if (patch) await profileState.setSettings(patch);
		return true;
	} catch (err) {
		// Darf den App-Start nie stören; beim nächsten Start versucht es die Übernahme erneut.
		console.error('[module] Bestandsübernahme fehlgeschlagen', err);
		return false;
	}
}
