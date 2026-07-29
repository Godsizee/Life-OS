import { goto } from '$app/navigation';
import { outbox } from '$lib/core/outbox.svelte';
import { unloadWorkspaceData } from '$lib/core/workspace-data';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import { signOut } from './api';

/**
 * Abmelden inklusive Aufräumen — bis dahin stand derselbe Ablauf doppelt in
 * `routes/more/+page.svelte` und `ui/SidebarNav.svelte`.
 *
 * Die Outbox wird bewusst geleert: Sie enthält Änderungen des abgemeldeten
 * Kontos und würde sonst beim nächsten Login in einen fremden Workspace laufen.
 */
export async function logout(): Promise<void> {
	await signOut();
	workspaceState.reset();
	unloadWorkspaceData();
	await outbox.clear();
	await goto('/login');
}
