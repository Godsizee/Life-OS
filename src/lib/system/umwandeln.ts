import { calendarState } from '#lib/features/calendar/store.svelte.js';
import { goalsState } from '#lib/features/goals/store.svelte.js';
import { habitsState } from '#lib/features/habits/store.svelte.js';
import { notesState } from '#lib/features/notes/store.svelte.js';
import { shoppingState } from '#lib/features/shopping/store.svelte.js';
import { tasksState } from '#lib/features/tasks/store.svelte.js';

export type Ziel = 'notiz' | 'einkauf' | 'termin' | 'routine' | 'ziel';

export const ZIEL_LABEL: Record<Ziel, string> = {
	notiz: 'Notiz',
	einkauf: 'Einkaufsartikel',
	termin: 'Termin',
	routine: 'Routine',
	ziel: 'Ziel'
};

/** Findet das Element, das ein `add…` neu in die Liste gelegt hat (die Stores geben keine Id zurück). */
function neuesElement<T extends { id: string }>(vorher: Set<string>, liste: T[]): T | undefined {
	return liste.find((x) => !vorher.has(x.id));
}

/**
 * Wandelt eine Aufgabe in ein anderes Objekt um: legt das Ziel an, nimmt die Aufgabe heraus und
 * bietet „Rückgängig“ (stellt die Aufgabe wieder her UND löscht das neue Objekt wieder).
 * Der Termin braucht Beginn und Ende (ISO-Zeitpunkte).
 */
export async function wandleUm(
	taskId: string,
	ziel: Ziel,
	termin?: { start: string; ende: string }
): Promise<void> {
	const task = tasksState.tasks.find((t) => t.id === taskId);
	if (!task) return;
	const text = task.description ?? '';

	let entfernen: () => Promise<void>;
	switch (ziel) {
		case 'notiz': {
			const vorher = new Set(notesState.notes.map((n) => n.id));
			await notesState.addNote({ title: task.title, body: text });
			const neu = neuesElement(vorher, notesState.notes);
			entfernen = async () => neu && (await notesState.removeNote(neu.id));
			break;
		}
		case 'einkauf': {
			const vorher = new Set(shoppingState.items.map((i) => i.id));
			await shoppingState.addItem({ name: task.title });
			const neu = neuesElement(vorher, shoppingState.items);
			entfernen = async () => neu && (await shoppingState.removeItem(neu.id));
			break;
		}
		case 'termin': {
			if (!termin) throw new Error('Für einen Termin fehlen Beginn und Ende.');
			const vorher = new Set(calendarState.events.map((e) => e.id));
			await calendarState.addEvent({
				title: task.title,
				start: termin.start,
				end: termin.ende,
				all_day: false
			});
			const neu = neuesElement(vorher, calendarState.events);
			entfernen = async () => neu && (await calendarState.removeEvent(neu.id));
			break;
		}
		case 'routine': {
			const vorher = new Set(habitsState.habits.map((h) => h.id));
			await habitsState.addHabit({ name: task.title });
			const neu = neuesElement(vorher, habitsState.habits);
			// Routinen lassen sich im Store nur archivieren; das Archiv blendet die neue Routine wieder aus.
			entfernen = async () => neu && (await habitsState.archiveHabit(neu.id));
			break;
		}
		case 'ziel': {
			const vorher = new Set(goalsState.goals.map((g) => g.id));
			await goalsState.addGoal({ title: task.title, description: text || undefined });
			const neu = neuesElement(vorher, goalsState.goals);
			entfernen = async () => neu && (await goalsState.removeGoal(neu.id));
			break;
		}
	}

	tasksState.removeTaskWithUndo(taskId, {
		text: `In ${ZIEL_LABEL[ziel]} umgewandelt`,
		beiRueckgaengig: entfernen
	});
}
