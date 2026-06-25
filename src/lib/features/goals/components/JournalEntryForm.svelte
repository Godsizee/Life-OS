<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import { goalsState } from '../store.svelte';

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
		goalsState.saveTodayEntry(mood, body);
	}

	function pickMood(value: string) {
		mood = value;
		save();
	}
</script>

<div class="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
	<p class="text-sm font-medium text-slate-700">
		{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
	</p>
	<div class="flex gap-1.5 xs:gap-2">
		{#each moods as m (m.value)}
			<button
				type="button"
				onclick={() => pickMood(m.value)}
				aria-label={m.value}
				class="flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl text-xl xs:text-2xl {mood ===
				m.value
					? 'bg-emerald-100 ring-2 ring-emerald-600'
					: 'bg-slate-100'}"
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
		class="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
	></textarea>
	<Button onclick={save}>
		{#snippet children()}
			Speichern
		{/snippet}
	</Button>
</div>
