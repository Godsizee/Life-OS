<script lang="ts">
	// Unwiderrufliches Löschen mit Tipp-Bestätigung.
	//
	// Ein reiner „Wirklich?"-Dialog wird nach dem dritten Mal blind weggeklickt.
	// Den Workspace-Namen abzutippen erzwingt eine bewusste Handlung — Vorbild:
	// GitHub-Repository-Löschung.
	import { AlertTriangle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/core/auth.svelte';
	import { outbox } from '$lib/core/outbox.svelte';
	import { toastState } from '$lib/core/toast.svelte';
	import { unloadWorkspaceData } from '$lib/core/workspace-data';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import { deleteAccount } from '../api';
	import { authErrorText } from '../errors';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let eingabe = $state('');
	let laeuft = $state(false);

	const bestaetigung = $derived(workspaceState.workspace?.name ?? '');
	const passt = $derived(eingabe.trim() === bestaetigung && bestaetigung.length > 0);

	// Beim Schliessen zuruecksetzen, damit ein erneutes Oeffnen nicht mit einer
	// bereits gueltigen Eingabe startet.
	$effect(() => {
		if (!open) eingabe = '';
	});

	async function loeschen() {
		if (!passt || laeuft) return;
		laeuft = true;
		try {
			await deleteAccount();
			// Reihenfolge zaehlt: erst lokal aufraeumen, dann navigieren. Die Outbox
			// enthaelt Aenderungen eines Kontos, das es nicht mehr gibt — sie wuerde
			// beim naechsten Login ins Leere laufen.
			authState.markIntentionalSignOut();
			workspaceState.reset();
			unloadWorkspaceData();
			await outbox.clear();
			open = false;
			await goto('/login');
			toastState.success('Konto und alle Daten wurden gelöscht.');
		} catch (error) {
			toastState.error(authErrorText(error));
		} finally {
			laeuft = false;
		}
	}
</script>

<Sheet bind:open title="Konto löschen">
	<div class="flex flex-col gap-4 px-4 pb-6">
		<div class="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
			<AlertTriangle size={18} class="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
			<div class="text-sm text-red-800 dark:text-red-300">
				<p class="font-semibold">Das lässt sich nicht rückgängig machen.</p>
				<p class="mt-1">
					Aufgaben, Notizen, Routinen, Termine, Einkaufslisten, Ziele, Tagebuch, Trainings und
					Gesundheitsdaten werden endgültig gelöscht.
				</p>
			</div>
		</div>

		<p class="text-sm text-text-secondary">
			Haushalte, in denen noch andere Mitglieder sind, bleiben bestehen — nur dein Zugang
			verschwindet. Vorher exportieren? Das geht unter „Daten exportieren".
		</p>

		<Field label="Zum Bestätigen den Namen des Haushalts eingeben" hint={bestaetigung}>
			<Input bind:value={eingabe} autocomplete="off" placeholder={bestaetigung} />
		</Field>

		<div class="flex flex-col gap-2">
			<Button variant="danger" fullWidth disabled={!passt} loading={laeuft} onclick={loeschen}>
				Konto endgültig löschen
			</Button>
			<Button variant="ghost" fullWidth onclick={() => (open = false)}>Abbrechen</Button>
		</div>
	</div>
</Sheet>
