<script lang="ts">
	// W9 — beliebigen Tag erfassen/aendern/loeschen. Ersetzt das reine Heute-Formular.
	import Sheet from '$lib/ui/Sheet.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import MoodPicker from './MoodPicker.svelte';
	import ActivityPicker from './ActivityPicker.svelte';
	import { moodState } from '../store.svelte';
	import { formatDate } from '$lib/core/date';
	import { Trash2 } from 'lucide-svelte';

	let {
		open = $bindable(false),
		date
	}: {
		open?: boolean;
		/** 'yyyy-mm-dd' — welcher Tag bearbeitet wird. */
		date: string;
	} = $props();

	let score = $state<number | null>(null);
	let note = $state('');
	let activities = $state<string[]>([]);
	let saving = $state(false);

	// Beim Öffnen (und bei Datumswechsel) aus dem Store befuellen.
	$effect(() => {
		if (!open) return;
		const entry = moodState.entryForDate(date);
		score = entry?.score ?? null;
		note = entry?.note ?? '';
		activities = [...(entry?.activities ?? [])];
	});

	const existing = $derived(moodState.entryForDate(date));

	async function save() {
		if (!score) return;
		saving = true;
		try {
			await moodState.saveFor(date, score, note, activities);
			open = false;
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!existing) return;
		await moodState.remove(existing.id);
		open = false;
	}
</script>

<Sheet bind:open title={formatDate(date)}>
	<div class="flex flex-col gap-5 px-4 pb-6">
		<div>
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
				{#snippet children()}{saving ? 'Speichere…' : 'Speichern'}{/snippet}
			</Button>
			{#if existing}
				<Button variant="danger" onclick={remove}>
					{#snippet children()}<Trash2 size={16} />{/snippet}
				</Button>
			{/if}
		</div>
	</div>
</Sheet>
