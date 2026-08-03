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
import { workspaceState } from '$lib/features/workspace/store.svelte';
import { focusSession } from '$lib/features/focus/session.svelte';
import { setzeAbgleich } from './resync';

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
	
	// Nach dem Laden: eine laufende Session muss auch außerhalb von /focus sichtbar sein.
	focusSession.restore();
	
	// Nachberechnung fehlender Analytics-Tage, sobald alle relevanten Stores befüllt sind
	void analyticsState.backfillScores(7);

	// Ab jetzt kann ein Verbindungsabbruch einen Abgleich ausloesen.
	setzeAbgleich(() => resyncWorkspaceData(workspaceId));
}

/**
 * Abgleich mit dem Server, ohne den sichtbaren Zustand vorher zu leeren.
 *
 * Spiegelt loadWorkspaceData(), ruft aber `reload()`: das setzt nur die intern
 * gemerkte `workspaceId` zurueck, damit der Early-Return in `load()` nicht
 * greift. Die Daten bleiben bis zum Eintreffen der neuen Antwort stehen — ein
 * `unload()` haette bei jedem Wiederverbinden kurz leere Listen gezeigt.
 *
 * `load()` ruft am Ende `subscribe()`, und jedes `subscribe()` raeumt seine
 * alten Kanaele selbst ab. Der Abgleich stellt damit auch die Realtime-Abos
 * wieder her — genau das, was nach einem Abbruch fehlt.
 *
 * Ausgeloest von: Kanalstatus in core/realtime.ts, `online`-Event und
 * `visibilitychange` in routes/+layout.svelte.
 */
export async function resyncWorkspaceData(workspaceId: string): Promise<void> {
	// Zuerst der Workspace selbst: Mitglieder koennen sich geaendert haben, und
	// die Stores ohne eigenen Parameter lesen die Workspace-ID von dort.
	await workspaceState.reload();

	await Promise.allSettled([
		tasksState.reload(workspaceId),
		notesState.reload(workspaceId),
		habitsState.reload(workspaceId),
		calendarState.reload(workspaceId),
		shoppingState.reload(workspaceId),
		goalsState.reload(workspaceId),
		fitnessState.reload(workspaceId),
		linksState.reload(workspaceId),
		remindersState.reload(workspaceId),
		attachmentsState.reload(workspaceId),
		healthState.reload(),
		moodState.reload(),
		analyticsState.reload(),
		timeTrackingState.reload(),
		profileState.reload()
	]);
}

/** Nur beim Logout — alle Abos schliessen und den Zustand verwerfen. */
export function unloadWorkspaceData(): void {
	setzeAbgleich(null);
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
