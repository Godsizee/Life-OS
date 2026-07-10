<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { calendarState } from '../store.svelte';

	type Recurrence = 'none' | 'daily' | 'weekly';
	const rruleByRecurrence: Record<Recurrence, string | null> = {
		none: null,
		daily: 'RRULE:FREQ=DAILY',
		weekly: 'RRULE:FREQ=WEEKLY'
	};

	let title = $state('');
	let start = $state('');
	let end = $state('');
	let allDay = $state(false);
	let location = $state('');
	let recurrence = $state<Recurrence>('none');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim() || !start) return;
		const startDate = new Date(start);
		const endDate = end ? new Date(end) : new Date(startDate.getTime() + 60 * 60 * 1000);
		await calendarState.addEvent({
			title,
			start: startDate.toISOString(),
			end: endDate.toISOString(),
			all_day: allDay,
			location: location || null,
			rrule: rruleByRecurrence[recurrence]
		});
		title = '';
		start = '';
		end = '';
		allDay = false;
		location = '';
		recurrence = 'none';
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<Input placeholder="Titel…" bind:value={title} required />
	<input
		type="datetime-local"
		bind:value={start}
		required
		class="min-h-12 w-full rounded-xl border border-border-color bg-surface-0 px-4 text-text-primary focus:border-emerald-500 focus:outline-none transition-colors duration-200"
	/>
	<input
		type="datetime-local"
		bind:value={end}
		class="min-h-12 w-full rounded-xl border border-border-color bg-surface-0 px-4 text-text-primary focus:border-emerald-500 focus:outline-none transition-colors duration-200"
	/>
	<Input placeholder="Ort (optional)…" bind:value={location} />
	<label class="flex min-h-12 items-center gap-2 text-sm text-text-secondary">
		<input type="checkbox" bind:checked={allDay} class="h-5 w-5" />
		Ganztägig
	</label>
	<select
		bind:value={recurrence}
		class="min-h-12 rounded-xl border border-border-color bg-surface-0 px-4 text-text-primary focus:border-emerald-500 focus:outline-none transition-colors duration-200"
	>
		<option value="none">Einmalig</option>
		<option value="daily">Täglich</option>
		<option value="weekly">Wöchentlich</option>
	</select>
	<Button type="submit">
		{#snippet children()}
			Hinzufügen
		{/snippet}
	</Button>
</form>
