<script lang="ts">
	// W6 — „Zeit nachtragen" (Toggl-Kern in der KISS-Variante).
	// Kein Sheet-Wrapper: die Komponente wird inline (TaskDetailSheet) UND in einem
	// Sheet (Fokus-Seite) verwendet — Sheets dürfen nicht verschachtelt werden.
	import { timeTrackingState } from '../store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { toISODate } from '$lib/core/date';
	import { toastState } from '$lib/core/toast.svelte';
	import StepperInput from '$lib/features/fitness/components/StepperInput.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Button from '$lib/ui/Button.svelte';

	let {
		taskId = null,
		onsaved
	}: {
		/** Vorbelegte Aufgabe. Ist sie gesetzt, wird die Auswahl ausgeblendet. */
		taskId?: string | null;
		onsaved?: () => void;
	} = $props();

	let minutes = $state<number | null>(25);
	let date = $state(toISODate(new Date()));
	let selectedTaskId = $state<string>(taskId ?? '');
	let note = $state('');
	let saving = $state(false);

	const openTasks = $derived(tasksState.tasks.filter((t) => t.status !== 'done'));

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (saving) return;
		if (!minutes || minutes < 1) {
			toastState.warning('Bitte eine Dauer ab 1 Minute angeben.');
			return;
		}
		saving = true;
		try {
			await timeTrackingState.addManual({
				minutes: Math.round(minutes),
				date,
				task_id: taskId ?? (selectedTaskId || null),
				note: note.trim() || null
			});
			toastState.success('Zeit nachgetragen.');
			minutes = 25;
			note = '';
			onsaved?.();
		} catch {
			toastState.error('Konnte den Eintrag nicht speichern.');
		} finally {
			saving = false;
		}
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-3">
	<div class="grid grid-cols-2 gap-3">
		<Field label="Dauer">
			<StepperInput bind:value={minutes} step={5} min={1} unit="min" label="Dauer" />
		</Field>
		<Field label="Datum">
			<Input type="date" bind:value={date} max={toISODate(new Date())} />
		</Field>
	</div>

	{#if taskId === null}
		<Field label="Aufgabe">
			<Select bind:value={selectedTaskId}>
				<option value="">Ohne Aufgabe</option>
				{#each openTasks as task (task.id)}
					<option value={task.id}>{task.title}</option>
				{/each}
			</Select>
		</Field>
	{/if}

	<Field label="Notiz" hint="Optional, z. B. „Telefonat Kunde„">
		<Input bind:value={note} maxlength={200} placeholder="Notiz…" />
	</Field>

	<Button type="submit" disabled={saving}>
		{#snippet children()}
			{saving ? 'Speichere…' : 'Zeit buchen'}
		{/snippet}
	</Button>
</form>
