<script lang="ts">
	import { Bell, Trash2 } from 'lucide-svelte';
	import { remindersState } from '../store.svelte';
	import {
		formatReminder,
		offsetLabel,
		reminderAtFromAnchor,
		reminderAtOnDate
	} from '../schedule';
	import type { ReminderEntityType } from '../types';
	import { toISODate } from '$lib/core/date';
	import { toastState } from '$lib/core/toast.svelte';
	import { haptic } from '$lib/core/haptics';
	import Button from '$lib/ui/Button.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';

	let {
		entityType,
		entityId,
		title,
		url = '/',
		mode = 'datetime',
		anchor = null,
		rrule = null,
		defaultDate = null,
		defaultTime = '09:00'
	}: {
		entityType: ReminderEntityType;
		/** null nur bei entityType === 'custom'. */
		entityId: string | null;
		/** Push-Titel (wird eingefroren). */
		title: string;
		/** Deep-Link für notificationclick. */
		url?: string;
		/**
		 * 'offset'   — Vorlauf-Chips relativ zu `anchor` (Termine)
		 * 'datetime' — freies Datum + Uhrzeit (Aufgaben, Sonstiges)
		 * 'time'     — nur Uhrzeit, Wiederholung kommt aus `rrule` (Routinen)
		 */
		mode?: 'offset' | 'datetime' | 'time';
		/** ISO-Ankerzeit für mode='offset'. */
		anchor?: string | null;
		/** Wiederholung für mode='time'. */
		rrule?: string | null;
		/** Vorbelegung yyyy-mm-dd für mode='datetime'. */
		defaultDate?: string | null;
		defaultTime?: string;
	} = $props();

	const OFFSETS = [0, 10, 30, 60, 1440];

	const list = $derived(remindersState.forEntity(entityType, entityId));

	let date = $state('');
	let time = $state('');
	let saving = $state(false);

	// Vorbelegungen erst im Effect setzen: als $state-Initialwert würde `defaultTime`
	// nur beim ersten Render gelesen und ein Wechsel der Entität nicht mitziehen.
	$effect(() => {
		if (!date) date = defaultDate ?? toISODate(new Date());
	});
	$effect(() => {
		if (!time) time = defaultTime;
	});

	async function create(remindAt: string, offsetMinutes: number, rule: string | null) {
		if (saving) return;
		saving = true;
		try {
			await remindersState.add({
				entity_type: entityType,
				entity_id: entityId,
				title,
				body: null,
				url,
				remind_at: remindAt,
				rrule: rule,
				offset_minutes: offsetMinutes
			});
			haptic();
			toastState.success('Erinnerung gesetzt');
		} catch {
			toastState.error('Erinnerung konnte nicht gesetzt werden');
		} finally {
			saving = false;
		}
	}

	function addOffset(minutes: number) {
		if (!anchor) return;
		create(reminderAtFromAnchor(anchor, minutes), minutes, null);
	}

	function addDateTime() {
		if (!date || !time) return;
		create(reminderAtOnDate(date, time), 0, null);
	}

	function addRecurring() {
		if (!time) return;
		create(reminderAtOnDate(toISODate(new Date()), time), 0, rrule);
	}

	async function remove(id: string) {
		await remindersState.remove(id);
		toastState.success('Erinnerung entfernt');
	}
</script>

<section class="flex flex-col gap-2">
	<h4 class="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
		<Bell size={14} /> Erinnerung
	</h4>

	{#if list.length > 0}
		<ul class="flex flex-col gap-1">
			{#each list as reminder (reminder.id)}
				<li
					class="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-border-color bg-surface-1 px-3"
				>
					<span class="min-w-0 truncate text-sm text-text-primary">
						{formatReminder(reminder)}
						{#if !reminder.active}
							<span class="ml-1 text-xs text-text-tertiary">(erledigt)</span>
						{/if}
					</span>
					<button
						onclick={() => remove(reminder.id)}
						aria-label="Erinnerung entfernen"
						class="flex h-11 w-11 shrink-0 items-center justify-center text-text-tertiary transition-all hover:text-red-500 active:scale-95"
					>
						<Trash2 size={16} />
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if mode === 'offset'}
		{#if anchor}
			<div class="flex flex-wrap gap-1.5">
				{#each OFFSETS as minutes (minutes)}
					<Chip onclick={() => addOffset(minutes)}>
						{offsetLabel(minutes)}
					</Chip>
				{/each}
			</div>
		{:else}
			<p class="text-xs text-text-tertiary">Erst eine Uhrzeit setzen, dann erinnern.</p>
		{/if}
	{:else if mode === 'time'}
		<div class="flex flex-wrap items-end gap-2">
			<Field label="Uhrzeit">
				<Input type="time" bind:value={time} />
			</Field>
			<Button variant="secondary" onclick={addRecurring} disabled={saving}>
				{#snippet children()}
					Erinnern
				{/snippet}
			</Button>
		</div>
	{:else}
		<div class="flex flex-wrap items-end gap-2">
			<Field label="Datum">
				<Input type="date" bind:value={date} />
			</Field>
			<Field label="Uhrzeit">
				<Input type="time" bind:value={time} />
			</Field>
			<Button variant="secondary" onclick={addDateTime} disabled={saving}>
				{#snippet children()}
					Erinnern
				{/snippet}
			</Button>
		</div>
	{/if}
</section>
