<script lang="ts">
	// W9/W10 — beliebigen Tag erfassen/aendern/loeschen mit Uhrzeit.
	import Sheet from '$lib/ui/Sheet.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Input from '$lib/ui/Input.svelte';
	import MoodPicker from './MoodPicker.svelte';
	import ActivityPicker from './ActivityPicker.svelte';
	import { moodState } from '../store.svelte';
	import { formatDate } from '$lib/core/date';
	import { MOOD_EMOJIS, MOOD_LABELS, type MoodEntry } from '../types';
	import { activityLabel } from '../activities';
	import { Trash2 } from 'lucide-svelte';

	let {
		open = $bindable(false),
		date
	}: {
		open?: boolean;
		/** 'yyyy-mm-dd' — welcher Tag bearbeitet wird. */
		date: string;
	} = $props();

	let editingEntryId = $state<string | null>(null);
	let score = $state<number | null>(null);
	let timeStr = $state('12:00');
	let note = $state('');
	let activities = $state<string[]>([]);
	let saving = $state(false);

	const dayEntries = $derived(moodState.entriesForDate(date));

	function resetForm() {
		editingEntryId = null;
		score = null;
		timeStr = '12:00';
		note = '';
		activities = [];
	}

	function loadEntry(entry: MoodEntry) {
		editingEntryId = entry.id;
		score = entry.score;
		const d = new Date(entry.logged_at);
		timeStr = isNaN(d.getTime())
			? '12:00'
			: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
		note = entry.note ?? '';
		activities = [...entry.activities];
	}

	$effect(() => {
		if (!open) return;
		resetForm();
	});

	async function save() {
		if (!score) return;
		saving = true;
		try {
			const [hh, mm] = timeStr.split(':').map(Number);
			const loggedAt = new Date(`${date}T${String(hh || 12).padStart(2, '0')}:${String(mm || 0).padStart(2, '0')}:00`).toISOString();
			await moodState.saveFor(date, score, note, activities, loggedAt);
			resetForm();
		} finally {
			saving = false;
		}
	}

	async function remove(id: string) {
		await moodState.remove(id);
		if (editingEntryId === id) resetForm();
	}
</script>

<Sheet bind:open title={formatDate(date)}>
	<div class="flex flex-col gap-5 px-4 pb-6">
		{#if dayEntries.length > 0}
			<div>
				<p class="mb-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
					Einträge an diesem Tag ({dayEntries.length})
				</p>
				<ul class="flex flex-col gap-1.5">
					{#each dayEntries as entry (entry.id)}
						{@const d = new Date(entry.logged_at)}
						{@const formattedTime = isNaN(d.getTime()) ? '' : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
						<li class="flex items-center justify-between gap-2 rounded-xl border border-border-color bg-surface-1 p-2.5">
							<button onclick={() => loadEntry(entry)} class="flex flex-1 items-center gap-2 text-left">
								<span class="text-lg">{MOOD_EMOJIS[entry.score]}</span>
								<div>
									<p class="text-xs font-bold text-text-primary">
										{formattedTime} · {MOOD_LABELS[entry.score]}
									</p>
									{#if entry.activities.length > 0}
										<p class="text-[11px] text-text-tertiary">
											{entry.activities.map(activityLabel).join(', ')}
										</p>
									{/if}
								</div>
							</button>
							<button
								onclick={() => remove(entry.id)}
								aria-label="Eintrag löschen"
								class="p-1 text-text-tertiary hover:text-red-500"
							>
								<Trash2 size={16} />
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="border-t border-border-color pt-3">
			<p class="mb-2 text-sm font-semibold text-text-primary">
				{editingEntryId ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
			</p>
			
			<div class="mb-4 flex items-center gap-2">
				<span class="text-xs font-medium text-text-secondary">Uhrzeit:</span>
				<div class="w-32">
					<Input type="time" bind:value={timeStr} />
				</div>
			</div>

			<p class="mb-2 text-sm font-semibold text-text-primary">Stimmung</p>
			<MoodPicker bind:value={score} />
		</div>

		<div>
			<p class="mb-2 text-sm font-semibold text-text-primary">Was hast du gemacht?</p>
			<ActivityPicker bind:value={activities} history={moodState.entries} />
		</div>

		<div>
			<p class="mb-2 text-sm font-semibold text-text-primary">Notiz</p>
			<Textarea bind:value={note} rows={3} placeholder="Optional…" />
		</div>

		<div class="flex gap-2">
			<Button onclick={save} disabled={!score || saving}>
				{#snippet children()}{saving ? 'Speichere…' : 'Eintrag hinzufügen'}{/snippet}
			</Button>
			{#if editingEntryId}
				<Button variant="secondary" onclick={resetForm}>
					{#snippet children()}Abbrechen{/snippet}
				</Button>
			{/if}
		</div>
	</div>
</Sheet>
