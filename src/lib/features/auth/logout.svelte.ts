import { goto } from '$app/navigation';
import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { toastState } from '$lib/core/toast.svelte';
import { unloadWorkspaceData } from '$lib/core/workspace-data';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import { signOut } from './api';
import { authErrorText } from './errors';

/**
 * Abmelden inklusive Aufräumen — bis dahin stand derselbe Ablauf doppelt in
 * `routes/more/+page.svelte` und `ui/SidebarNav.svelte`.
 *
 * Die Outbox wird bewusst geleert: Sie enthält Änderungen des abgemeldeten
 * Kontos und würde sonst beim nächsten Login in einen fremden Workspace laufen.
 */

let loading = $state(false);

export const logoutState = {
	get loading() {
		return loading;
	}
};

/**
 * Schlägt signOut() fehl (z. B. offline), bricht die Funktion bewusst ab, statt
 * lokal einen abgemeldeten Zustand vorzutäuschen, den der Server nicht kennt:
 * die Sitzung bliebe sonst clientseitig "weg", obwohl sie serverseitig noch
 * gilt, und der Nutzer landete angemeldet auf der Login-Seite. Stattdessen
 * bekommt er einen Toast mit dem Grund und kann es erneut versuchen.
 */
export async function logout(): Promise<void> {
	if (loading) return;
	loading = true;
	authState.markIntentionalSignOut();

	try {
		await signOut();
	} catch (error) {
		toastState.error(authErrorText(error));
		loading = false;
		return;
	}

	// Bewusst KEIN finally um signOut(): der Spinner lief vorher aus, waehrend
	// Teardown, outbox.clear() (IndexedDB) und goto() noch liefen — sichtbar
	// passierte in dieser Zeit nichts.
	try {
		workspaceState.reset();
		unloadWorkspaceData();
		await outbox.clear();
		await goto('/login');
		// Der Toaster haengt im Layout ausserhalb des Nav-Guards und laeuft auch
		// auf /login — die Abmeldung wird damit bestaetigt statt nur beendet.
		toastState.success('Du bist abgemeldet.');
	} finally {
		loading = false;
	}
}
