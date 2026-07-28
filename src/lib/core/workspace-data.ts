/**
 * Zentrales Laden/Entladen aller Workspace-Daten.
 *
 * HINTERGRUND: Vorher lud und entlud jede Route ihre Stores selbst. Die beiden
 * Listen stimmten an acht Stellen nicht ueberein — mit drei Folgen:
 *
 *  1. Global gerenderte Komponenten sahen je nach Route andere Daten. Die
 *     Kommandopalette (Ctrl+K) liest Aufgaben, Notizen, Termine, Ziele und
 *     Routinen; auf /shopping oder /mood waren die Stores leer und die Suche
 *     fand nichts. dispatchNLP() scheiterte dort mit „Kein Workspace geladen".
 *  2. Feature-uebergreifende Logik lief ins Leere: Journal-Anhaenge auf /goals
 *     (attachmentsState war nur auf /notes geladen), Aufgabe-zu-Routine beim
 *     Abhaken auf /tasks (habitsState war nur auf /habits geladen).
 *  3. Der Wechsel auf das Dashboard lud 14 Stores komplett neu, weil die
 *     vorherige Route sie entladen hatte.
 *
 * Jetzt: einmal nach dem Workspace-Load, entladen nur beim Logout. Die Stores
 * haben ohnehin einen `workspaceId`-Early-Return, ein zweiter Aufruf ist gratis.
 *
 * Ausdruecklich NICHT hier: fitnessState.loadAllSetLogs() — bewusst lazy und
 * gecacht, wird von den Auswertungsseiten selbst angestossen.
 */
import { analyticsState } from '$lib/features/analytics/store.svelte';
import { attachmentsState } from '$lib/features/attachments/store.svelte';
import { calendarState } from '$lib/features/calendar/store.svelte';
import { fitnessState } from '$lib/features/fitness/store.svelte';
import { goalsState } from '$lib/features/goals/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { healthState } from '$lib/features/health/store.svelte';
import { linksState } from '$lib/features/links/store.svelte';
import { moodState } from '$lib/features/mood/store.svelte';
import { notesState } from '$lib/features/notes/store.svelte';
import { profileState } from '$lib/features/profile/store.svelte';
import { remindersState } from '$lib/features/reminders/store.svelte';
import { shoppingState } from '$lib/features/shopping/store.svelte';
import { tasksState } from '$lib/features/tasks/store.svelte';
import { timeTrackingState } from '$lib/features/timetracking/store.svelte';

/**
 * Laedt alle Module parallel. Ein einzelner Fehlschlag darf die uebrigen nicht
 * verhindern — die Stores melden ihn selbst (toast) und bleiben leer.
 */
export async function loadWorkspaceData(workspaceId: string): Promise<void> {
	await Promise.allSettled([
		tasksState.load(workspaceId),
		notesState.load(workspaceId),
		habitsState.load(workspaceId),
		calendarState.load(workspaceId),
		shoppingState.load(workspaceId),
		goalsState.load(workspaceId),
		fitnessState.load(workspaceId),
		linksState.load(workspaceId),
		remindersState.load(workspaceId),
		attachmentsState.load(workspaceId),
		healthState.load(),
		moodState.load(),
		analyticsState.load(),
		timeTrackingState.load(),
		profileState.load()
	]);
}

/** Nur beim Logout — alle Abos schliessen und den Zustand verwerfen. */
export function unloadWorkspaceData(): void {
	tasksState.unload();
	notesState.unload();
	habitsState.unload();
	calendarState.unload();
	shoppingState.unload();
	goalsState.unload();
	fitnessState.unload();
	linksState.unload();
	remindersState.unload();
	attachmentsState.unload();
	healthState.unload();
	moodState.unload();
	analyticsState.unload();
	timeTrackingState.unload();
	profileState.unload();
}
