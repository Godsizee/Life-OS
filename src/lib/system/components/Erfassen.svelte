<script lang="ts">
	import { tick } from 'svelte';
	import { toastState } from '#lib/core/toast.svelte.js';
	import { haptic } from '#lib/core/haptics.js';
	import Sheet from '#lib/ui/Sheet.svelte';
	import Input from '#lib/ui/Input.svelte';
	import Button from '#lib/ui/Button.svelte';
	import { ErfassenSitzung } from '../erfassen-sitzung.svelte.js';
	import ErfassenDeutung from './ErfassenDeutung.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const sitzung = new ErfassenSitzung();
	let saving = $state(false);
	let field = $state<HTMLInputElement | null>(null);

	// Beim Öffnen direkt ins Feld – ein Tap auf den FAB soll zum Tippen führen,
	// nicht zu einem weiteren Tap.
	$effect(() => {
		if (!open) return;
		void tick().then(() => field?.focus());
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!sitzung.aktuell || saving) return;

		saving = true;
		try {
			const meldung = await sitzung.ausfuehren();
			if (meldung) {
				haptic(15);
				toastState.success(meldung);
				open = false;
			}
		} catch {
			toastState.error('Konnte nicht gespeichert werden.');
		} finally {
			saving = false;
		}
	}
</script>

<Sheet bind:open title="Schnell erfassen">
	<form onsubmit={submit} class="flex flex-col gap-3 px-4 pb-4">
		<Input
			bind:element={field}
			bind:value={sitzung.text}
			placeholder="z. B. 3x Eier, Morgen 10:00 Meeting, 75kg, Laufen"
			enterkeyhint="done"
			autocomplete="off"
		/>

		<ErfassenDeutung {sitzung} />

		<Button type="submit" fullWidth loading={saving} disabled={!sitzung.aktuell}>
			{#snippet children()}{sitzung.aktuell
					? `Als ${sitzung.aktuell.art.label} anlegen`
					: 'Hinzufügen'}{/snippet}
		</Button>
	</form>
</Sheet>
