<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import { goalsState } from '../store.svelte';
	import { buildDayContext } from '../day-context';
	import DayContextStrip from './DayContextStrip.svelte';
	import AttachmentSection from '$lib/features/attachments/components/AttachmentSection.svelte';
	import type { JournalKind } from '../types';

	let {
		date,
		kind = 'daily',
		onsubmitted
	}: {
		date: string;
		kind?: JournalKind;
		onsubmitted?: () => void;
	} = $props();

	const moods = [
		{ value: 'great', label: '😄' },
		{ value: 'good', label: '🙂' },
		{ value: 'okay', label: '😐' },
		{ value: 'bad', label: '🙁' },
		{ value: 'terrible', label: '😢' }
	];

	let mood = $state<string | null>(null);
	let body = $state('');
	let loadedFor = $state<string | null>(null);
	let entryId = $state<string | null>(null);
	let saving = $state(false);

	// Context existiert nur für 'daily'.
	const context = $derived(kind === 'daily' ? buildDayContext(date) : null);

	$effect(() => {
		const key = `${date}-${kind}`;
		if (loadedFor !== key) {
			const entry = goalsState.journalEntries.find((e) => e.date === date && e.kind === kind);
			mood = entry?.mood ?? null;
			body = entry?.body ?? '';
			entryId = entry?.id ?? null;
			loadedFor = key;
		}
	});

	async function save() {
		saving = true;
		try {
			// Attachments brauchen eine ID — wir erzeugen notfalls eine leere Hülle.
			if (!entryId) {
				entryId = await goalsState.ensureEntry(date);
			}
			await goalsState.saveJournalEntry(date, mood, body, context, kind);
		} finally {
			saving = false;
		}
	}

	async function pickMood(value: string) {
		mood = value;
		await save();
	}

	async function submit() {
		await save();
		onsubmitted?.();
	}
</script>

<div class="flex flex-col gap-3">
	{#if kind === 'daily'}
		<!-- Welle 5.5 — Dein Tag in Zahlen -->
		{#if context}
			<DayContextStrip {context} />
		{/if}
		<div class="flex gap-1.5 xs:gap-2">
			{#each moods as m (m.value)}
				<button
					type="button"
					onclick={() => pickMood(m.value)}
					disabled={saving}
					aria-label={m.value}
					class="flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl text-xl xs:text-2xl transition-all disabled:opacity-50 {mood ===
					m.value
						? 'bg-primary-100 dark:bg-primary-950/40 ring-2 ring-primary-600 dark:ring-primary-400'
						: 'bg-surface-2 hover:bg-surface-3 text-text-primary'}"
				>
					{m.label}
				</button>
			{/each}
		</div>
	{/if}

	<Textarea
		bind:value={body}
		onblur={save}
		disabled={saving}
		rows={8}
		placeholder={kind === 'weekly' ? 'Notizen zum Wochenabschluss…' : 'Wie war dein Tag?'}
		surface="1"
	/>

	{#if entryId}
		<div class="rounded-xl border border-border-color bg-surface-1 p-3">
			<AttachmentSection entityType="journal" entityId={entryId} />
		</div>
	{/if}

	<Button onclick={submit} disabled={saving}>
		{#snippet children()}
			{saving ? 'Speichere…' : 'Fertig'}
		{/snippet}
	</Button>
</div>
