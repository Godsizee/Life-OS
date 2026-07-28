<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import ReminderSection from '$lib/features/reminders/components/ReminderSection.svelte';
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

	function toDatetimeLocal(iso: string | undefined): string {
		if (!iso) return '';
		const d = new Date(iso);
		if (isNaN(d.getTime())) return '';
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	/**
	 * Beim Patchen einer einzelnen Ausprägung zählt deren Datum, nicht das
	 * Startdatum der Serie — Uhrzeit bleibt die des Termins.
	 */
	function slotZeiten(e: Event | undefined, datum: string | undefined) {
		if (!datum || !e?.start || !e?.end) return { start: e?.start, end: e?.end };
		const s = new Date(e.start);
		const en = new Date(e.end);
		const [y, m, d] = datum.split('-').map(Number);
		s.setFullYear(y, m - 1, d);
		en.setFullYear(y, m - 1, d);
		return { start: s.toISOString(), end: en.toISOString() };
	}

	let title = $state('');
	let start = $state('');
	let end = $state('');
	let allDay = $state(false);
	let location = $state('');
	let recurrence = $state<Recurrence>('none');
	let calendarId = $state('');
	let attendeeIds = $state<string[]>([]);

	/**
	 * Felder aus `event`/`occurrenceDate` befüllen — beim ersten Render und immer,
	 * wenn ein ANDERER Termin/Slot bearbeitet wird. Vorher standen die Werte direkt
	 * in den `$state`-Deklarationen: die laufen nur einmal, ein zweiter im selben
	 * offenen Formular angeklickter Termin zeigte weiter die alten Daten.
	 */
	let hydratedFor = $state<string | null | undefined>(undefined);
	$effect(() => {
		const key = event ? `${event.id}:${occurrenceDate ?? ''}` : null;
		if (key === hydratedFor) return;
		hydratedFor = key;

		const zeiten = slotZeiten(event, occurrenceDate);
		title = event?.title ?? '';
		start = toDatetimeLocal(zeiten.start);
		end = toDatetimeLocal(zeiten.end);
		allDay = event?.all_day ?? false;
		location = event?.location ?? '';
		recurrence = event?.rrule?.includes('WEEKLY')
			? 'weekly'
			: event?.rrule?.includes('DAILY')
				? 'daily'
				: 'none';
		calendarId = event?.calendar_id ?? calendarState.defaultCalendarId ?? '';
		attendeeIds = [...(event?.attendee_ids ?? [])];
	});

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

	{#if event}
		<ReminderSection
			entityType="event"
			entityId={event.id}
			title={event.title}
			url="/calendar"
			mode="offset"
			anchor={event.start}
		/>
	{/if}

	<Button type="submit">
		{#snippet children()}
			{event ? 'Speichern' : 'Hinzufügen'}
		{/snippet}
	</Button>
</form>
