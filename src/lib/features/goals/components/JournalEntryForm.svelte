<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import { goalsState } from '../store.svelte';
	import { buildDayContext } from '../day-context';
	import DayContextStrip from './DayContextStrip.svelte';

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

	// Live-Snapshot des heutigen Tages (aggregiert aus allen Modulen).
	const context = $derived(buildDayContext(goalsState.todayKey));

	$effect(() => {
		const entry = goalsState.todayEntry;
		const key = goalsState.todayKey;
		if (loadedFor !== key) {
			mood = entry?.mood ?? null;
			body = entry?.body ?? '';
			loadedFor = key;
		}
	});

	function save() {
		goalsState.saveTodayEntry(mood, body, context);
	}

	function pickMood(value: string) {
		mood = value;
		save();
	}
</script>

<div class="flex flex-col gap-2 rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
	<p class="text-sm font-medium text-text-primary">
		{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
	</p>

	<!-- Welle 5.5 — Dein Tag in Zahlen -->
	<DayContextStrip {context} />

	<div class="flex gap-1.5 xs:gap-2">
		{#each moods as m (m.value)}
			<button
				type="button"
				onclick={() => pickMood(m.value)}
				aria-label={m.value}
				class="flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl text-xl xs:text-2xl transition-all {mood ===
				m.value
					? 'bg-emerald-100 dark:bg-emerald-950/40 ring-2 ring-emerald-600 dark:ring-emerald-400'
					: 'bg-surface-2 hover:bg-surface-3 text-text-primary'}"
			>
				{m.label}
			</button>
		{/each}
	</div>
	<textarea
		bind:value={body}
		onblur={save}
		rows={4}
		placeholder="Wie war dein Tag?"
		class="w-full rounded-xl border border-border-color bg-surface-1 p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-emerald-500 focus:outline-none transition-colors duration-200"
	></textarea>
	<Button onclick={save}>
		{#snippet children()}
			Speichern
		{/snippet}
	</Button>
</div>
