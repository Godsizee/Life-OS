<script lang="ts">
	import { toISODate } from '$lib/core/date';
	import { moodState } from '$lib/features/mood/store.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import MoodPicker from '$lib/features/mood/components/MoodPicker.svelte';
	import { MOOD_LABELS } from '$lib/features/mood/types';
	import { Angry, Frown, Meh, Smile, SmilePlus } from 'lucide-svelte';

	$effect(() => {
		if (workspaceState.workspace?.id) moodState.load();
	});

	let selectedScore = $state<number | null>(null);
	let note = $state('');
	let saving = $state(false);

	$effect(() => {
		if (moodState.todayEntry) {
			selectedScore = moodState.todayEntry.score;
			note = moodState.todayEntry.note ?? '';
		}
	});

	async function save() {
		if (!selectedScore) return;
		saving = true;
		try {
			await moodState.save(selectedScore, note.trim() || null);
		} finally {
			saving = false;
		}
	}

	// 30-Tage-Grid
	const gridDays = $derived(() => {
		const days = [];
		for (let i = 29; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const key = toISODate(d);
			const entry = moodState.entries.find((e) => e.date === key);
			days.push({ key, day: d.getDate(), entry });
		}
		return days;
	});

	const scoreColors: Record<number, string> = {
		1: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50',
		2: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50',
		3: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50',
		4: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50',
		5: 'bg-primary-700 dark:bg-primary-600 text-white border-transparent'
	};

	const moodIcons: Record<number, typeof Frown> = {
		1: Angry,
		2: Frown,
		3: Meh,
		4: Smile,
		5: SmilePlus
	};
</script>

<svelte:head>
	<title>Stimmung - Life OS</title>
</svelte:head>

<header class="mb-4">
	<h1 class="text-2xl font-bold tracking-tight">Wie geht's dir?</h1>
	<p class="text-sm text-text-secondary">{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
</header>

<!-- Heute-Picker -->
<div class="mb-4 rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
	<h2 class="mb-3 text-sm font-semibold text-text-primary">Stimmung heute</h2>
	<MoodPicker bind:value={selectedScore} />
	{#if selectedScore}
		<div class="mt-3 flex flex-col gap-2">
			<textarea
				bind:value={note}
				rows="2"
				placeholder="Notiz (optional)…"
				class="rounded-xl border border-border-color bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none transition-colors duration-200"
			></textarea>
			<button
				onclick={save}
				disabled={saving}
				class="min-h-11 rounded-xl bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-sm font-medium text-white active:scale-95 disabled:opacity-60 transition-all"
			>
				{saving ? 'Speichere…' : 'Speichern'}
			</button>
		</div>
	{/if}
</div>

<!-- 30-Tage-Kalender-Grid -->
<div class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
	<h2 class="mb-3 text-sm font-semibold text-text-primary">Letzte 30 Tage</h2>
	<!-- max-w keeps the grid from ballooning on wide viewports; auto-margin centres it -->
	<div class="mx-auto max-w-xs sm:max-w-sm">
		<div class="grid grid-cols-7 gap-1.5">
			{#each gridDays() as { key, day, entry } (key)}
				{@const Icon = entry ? moodIcons[entry.score] : null}
				<div
					title={entry ? `${MOOD_LABELS[entry.score]}` : 'Kein Eintrag'}
					class="flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold transition-colors
						{entry ? scoreColors[entry.score] : 'bg-surface-2 text-text-tertiary border border-border-color/20'}"
				>
					{#if Icon}
						<Icon size={14} strokeWidth={2} />
					{:else}
						<span class="tabular-nums">{day}</span>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Legend -->
		<div class="mt-3 flex items-center justify-between px-0.5">
			{#each [1,2,3,4,5] as score}
				{@const LegendIcon = moodIcons[score]}
				<span class="flex items-center gap-1 text-xs text-text-tertiary">
					<span class="inline-flex h-4 w-4 items-center justify-center rounded {scoreColors[score]}">
						<LegendIcon size={9} strokeWidth={2.5} />
					</span>
					<span class="hidden sm:inline">{MOOD_LABELS[score]}</span>
				</span>
			{/each}
		</div>
	</div>
</div>
