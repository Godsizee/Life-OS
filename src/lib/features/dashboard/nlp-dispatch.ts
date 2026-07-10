// Welle 5.8 — führt eine per NLP geparste Eingabe im richtigen Modul aus.
// Gemeinsame Logik für Dashboard-Quick-Add und Command Palette.
import { parseNLPInput } from '$lib/core/nlp-parse';
import { tasksState } from '$lib/features/tasks/store.svelte';
import { shoppingState } from '$lib/features/shopping/store.svelte';
import { calendarState } from '$lib/features/calendar/store.svelte';
import { healthState } from '$lib/features/health/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { notesState } from '$lib/features/notes/store.svelte';
import { goalsState } from '$lib/features/goals/store.svelte';
import { moodState } from '$lib/features/mood/store.svelte';

/** Führt die Eingabe aus und gibt ein Erfolgs-Label zurück (oder null bei leer). */
export async function dispatchNLP(text: string): Promise<string | null> {
	const trimmed = text.trim();
	if (!trimmed) return null;
	const parsed = parseNLPInput(trimmed);

	switch (parsed.type) {
		case 'task':
			await tasksState.addTask({ title: parsed.parsed.title, priority: parsed.parsed.priority });
			return 'Aufgabe hinzugefügt';
		case 'shopping':
			await shoppingState.addItem({ name: parsed.parsed.name, qty: parsed.parsed.quantity });
			return 'Zum Einkauf hinzugefügt';
		case 'event': {
			const start = parsed.parsed.due_at;
			const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
			await calendarState.addEvent({ title: parsed.parsed.title, start, end });
			return 'Kalendertermin erstellt';
		}
		case 'health':
			await healthState.save({
				weight_kg: parsed.parsed.weight_kg ?? healthState.todayEntry?.weight_kg ?? null,
				sleep_h: parsed.parsed.sleep_h ?? healthState.todayEntry?.sleep_h ?? null,
				water_glasses: parsed.parsed.water_glasses ?? healthState.todayEntry?.water_glasses ?? null,
				energy: parsed.parsed.energy ?? healthState.todayEntry?.energy ?? null
			});
			return 'Gesundheitseintrag aktualisiert';
		case 'habit':
			await habitsState.toggleToday(parsed.parsed.habitId);
			return `Routine „${parsed.parsed.name}" geloggt`;
		case 'note':
			await notesState.addNote({ title: parsed.parsed.title, body: parsed.parsed.body || undefined });
			return 'Notiz erstellt';
		case 'goal':
			await goalsState.addGoal({ title: parsed.parsed.title });
			return 'Ziel erstellt';
		case 'mood':
			await moodState.save(parsed.parsed.score, parsed.parsed.note ?? null);
			return 'Stimmung gespeichert';
		default:
			return null;
	}
}
