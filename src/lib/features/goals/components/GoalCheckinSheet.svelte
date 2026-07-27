<script lang="ts">
	// W8 — „+ Check-in": Zuwachs, Datum, optionale Notiz. Werte sind additiv.
	import Sheet from '$lib/ui/Sheet.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import StepperInput from '$lib/features/fitness/components/StepperInput.svelte';
	import { toISODate } from '$lib/core/date';
	import { toastState } from '$lib/core/toast.svelte';
	import { haptic } from '$lib/core/haptics';
	import { goalsState } from '../store.svelte';
	import type { Goal } from '../types';

	let { goal, open = $bindable(false) }: { goal: Goal; open?: boolean } = $props();

	let value = $state<number | null>(1);
	let date = $state(toISODate(new Date()));
	let note = $state('');
	let saving = $state(false);

	// Beim Öffnen zurücksetzen — das Sheet lebt länger als ein Check-in.
	$effect(() => {
		if (open) {
			value = 1;
			date = toISODate(new Date());
			note = '';
		}
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!value || value <= 0) return;
		saving = true;
		try {
			await goalsState.addCheckin({
				goal_id: goal.id,
				date,
				value,
				note: note.trim() || null
			});
			haptic(10);
			toastState.success('Check-in gespeichert');
			open = false;
		} catch (error) {
			toastState.error(error instanceof Error ? error.message : 'Check-in fehlgeschlagen');
		} finally {
			saving = false;
		}
	}
</script>

<Sheet bind:open title="Check-in">
	{#snippet children()}
		<form onsubmit={submit} class="flex flex-col gap-4 p-4">
			<p class="text-sm text-text-secondary">
				Wie viel ist seit dem letzten Check-in dazugekommen?
			</p>

			<StepperInput
				bind:value
				step={1}
				min={0}
				label="Zuwachs"
				unit={goal.target_unit ?? ''}
				placeholder="0"
			/>

			<Field label="Datum">
				<Input type="date" bind:value={date} max={toISODate(new Date())} />
			</Field>

			<Field label="Notiz" hint="Optional, max. 200 Zeichen">
				<Input bind:value={note} maxlength={200} placeholder="z. B. Kapitel 4 fertig" />
			</Field>

			<Button type="submit" disabled={saving || !value || value <= 0}>
				{#snippet children()}
					{saving ? 'Speichere…' : 'Check-in speichern'}
				{/snippet}
			</Button>
		</form>
	{/snippet}
</Sheet>
