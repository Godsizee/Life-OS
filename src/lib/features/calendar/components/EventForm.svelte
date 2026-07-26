<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import { calendarState } from '../store.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import type { Event } from '../types';

	let {
		onsubmitted,
		event,
		occurrenceDate
	}: {
		onsubmitted?: () => void;
		event?: Event;
		occurrenceDate?: string;
	} = $props();

	type Recurrence = 'none' | 'daily' | 'weekly';
	const rruleByRecurrence: Record<Recurrence, string | null> = {
		none: null,
		daily: 'RRULE:FREQ=DAILY',
		weekly: 'RRULE:FREQ=WEEKLY'
	};

	function toDatetimeLocal(iso?: string): string {
		if (!iso) return '';
		const d = new Date(iso);
		if (isNaN(d.getTime())) return '';
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	let title = $state(event?.title ?? '');
	// Falls wir eine Occurrence patchen, wäre es gut, das Startdatum auf occurrenceDate zu setzen (mit der Uhrzeit von event.start)
	let initialStart = event?.start;
	let initialEnd = event?.end;
	if (occurrenceDate && event?.start && event?.end) {
		const s = new Date(event.start);
		const e = new Date(event.end);
		const [y, m, d] = occurrenceDate.split('-').map(Number);
		s.setFullYear(y, m - 1, d);
		e.setFullYear(y, m - 1, d);
		initialStart = s.toISOString();
		initialEnd = e.toISOString();
	}

	let start = $state(toDatetimeLocal(initialStart));
	let end = $state(toDatetimeLocal(initialEnd));
	let allDay = $state(event?.all_day ?? false);
	let location = $state(event?.location ?? '');
	let recurrence = $state<Recurrence>(
		event?.rrule?.includes('WEEKLY') ? 'weekly' : event?.rrule?.includes('DAILY') ? 'daily' : 'none'
	);

	let calendarId = $state(event?.calendar_id ?? calendarState.defaultCalendarId ?? '');
	let attendeeIds = $state<string[]>(event?.attendee_ids ?? []);

	function toggleAttendee(id: string) {
		if (attendeeIds.includes(id)) {
			attendeeIds = attendeeIds.filter(x => x !== id);
		} else {
			attendeeIds = [...attendeeIds, id];
		}
	}

	async function submit(ev: SubmitEvent) {
		ev.preventDefault();
		if (!title.trim() || !start) return;
		const startDate = new Date(start);
		const endDate = end ? new Date(end) : new Date(startDate.getTime() + 60 * 60 * 1000);
		
		if (occurrenceDate && event) {
			await calendarState.patchOccurrence(event.id, occurrenceDate, {
				title,
				start: startDate.toISOString(),
				end: endDate.toISOString(),
				location: location || null
			});
		} else if (event) {
			await calendarState.updateEvent(event.id, {
				title,
				start: startDate.toISOString(),
				end: endDate.toISOString(),
				all_day: allDay,
				location: location || null,
				rrule: rruleByRecurrence[recurrence],
				calendar_id: calendarId,
				attendee_ids: attendeeIds
			});
		} else {
			await calendarState.addEvent({
				title,
				start: startDate.toISOString(),
				end: endDate.toISOString(),
				all_day: allDay,
				location: location || null,
				rrule: rruleByRecurrence[recurrence],
				calendar_id: calendarId,
				attendee_ids: attendeeIds
			});
		}
		onsubmitted?.();
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-3">
	<!-- Kalender Auswahl -->
	<Select bind:value={calendarId} required>
		{#each calendarState.calendars as cal (cal.id)}
			<option value={cal.id}>{cal.name}</option>
		{/each}
	</Select>

	<Input placeholder="Titel…" bind:value={title} required />
	<Input type="datetime-local" bind:value={start} required />
	<Input type="datetime-local" bind:value={end} />
	<Input placeholder="Ort (optional)…" bind:value={location} />
	
	<label class="flex min-h-12 items-center gap-2 text-sm text-text-secondary">
		<input type="checkbox" bind:checked={allDay} class="h-5 w-5" />
		Ganztägig
	</label>
	
	<Select bind:value={recurrence} disabled={!!occurrenceDate}>
		<option value="none">Einmalig</option>
		<option value="daily">Täglich</option>
		<option value="weekly">Wöchentlich</option>
	</Select>

	<!-- Teilnehmer -->
	{#if workspaceState.members.length > 0 && !occurrenceDate}
		<div>
			<span class="mb-1 block text-xs font-bold uppercase tracking-wide text-text-tertiary">Teilnehmer</span>
			<div class="flex flex-wrap gap-2">
				{#each workspaceState.members as member (member.user_id)}
					<Chip 
						selected={attendeeIds.includes(member.user_id)} 
						onclick={() => toggleAttendee(member.user_id)}
					>
						{member.profile?.display_name ?? 'Mitglied'}
					</Chip>
				{/each}
			</div>
		</div>
	{/if}

	<Button type="submit">
		{#snippet children()}
			{event ? 'Speichern' : 'Hinzufügen'}
		{/snippet}
	</Button>
</form>
