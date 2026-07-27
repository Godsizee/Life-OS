<script lang="ts">
	import { moodState } from '$lib/features/mood/store.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import MoodPicker from '$lib/features/mood/components/MoodPicker.svelte';
	import ActivityPicker from '$lib/features/mood/components/ActivityPicker.svelte';
	import YearInPixels from '$lib/features/mood/components/YearInPixels.svelte';
	import MoodEntrySheet from '$lib/features/mood/components/MoodEntrySheet.svelte';
	import MoodActivityStats from '$lib/features/mood/components/MoodActivityStats.svelte';
	import WeekdayAverages from '$lib/features/mood/components/WeekdayAverages.svelte';
	import { MOOD_LABELS } from '$lib/features/mood/types';
	import { MOOD_CLASSES } from '$lib/features/mood/colors';
	import {
		availableYears,
		averageScore,
		entriesInYear,
		filterSince,
		formatScore,
		yearPixels
	} from '$lib/features/mood/stats';
	import { formatDate, toISODate } from '$lib/core/date';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Chip from '$lib/ui/Chip.svelte';

	$effect(() => {
		if (workspaceState.workspace?.id) moodState.load();
	});

	// ── Heute erfassen ──────────────────────────────────────────────
	let selectedScore = $state<number | null>(null);
	let note = $state('');
	let activities = $state<string[]>([]);
	let saving = $state(false);
	let hydratedFor = $state<string | null>(null);

	// Formular genau einmal je Tageseintrag aus dem Store befuellen — sonst
	// wuerde jede Realtime-Aenderung die Eingabe des Nutzers ueberschreiben.
	$effect(() => {
		const entry = moodState.todayEntry;
		const key = entry ? `${entry.id}:${entry.date}` : null;
		if (key === hydratedFor) return;
		hydratedFor = key;
		selectedScore = entry?.score ?? null;
		note = entry?.note ?? '';
		activities = [...(entry?.activities ?? [])];
	});

	async function save() {
		if (!selectedScore) return;
		saving = true;
		try {
			await moodState.save(selectedScore, note, activities);
		} finally {
			saving = false;
		}
	}

	// ── Year in Pixels ──────────────────────────────────────────────
	const currentYear = new Date().getFullYear();
	let year = $state(currentYear);
	const years = $derived(availableYears(moodState.entries, currentYear));
	const months = $derived(yearPixels(moodState.entries, year));
	const yearEntries = $derived(entriesInYear(moodState.entries, year));
	const yearAverage = $derived(averageScore(yearEntries));

	async function pickYear(y: number) {
		year = y;
		await moodState.loadYear(y);
	}

	// ── Tages-Sheet ─────────────────────────────────────────────────
	let sheetOpen = $state(false);
	let sheetDate = $state(toISODate(new Date()));

	function openDay(date: string) {
		sheetDate = date;
		sheetOpen = true;
	}

	// ── Statistik-Zeitraum ──────────────────────────────────────────
	let statsDays = $state(90);
	const statsEntries = $derived(filterSince(moodState.entries, statsDays));
</script>

<svelte:head>
	<title>Stimmung - Life OS</title>
</svelte:head>

<PageHeader title="Wie geht's dir?" subtitle={formatDate(new Date())} />

<div class="flex flex-col gap-4">
	<!-- Heute -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Stimmung heute</h2>
		<MoodPicker bind:value={selectedScore} />

		{#if selectedScore}
			<div class="mt-4 flex flex-col gap-4">
				<div>
					<p class="mb-2 text-sm font-semibold text-text-primary">Was hast du gemacht?</p>
					<ActivityPicker bind:value={activities} history={moodState.entries} />
				</div>

				<Textarea bind:value={note} rows={2} placeholder="Notiz (optional)…" />

				<button
					onclick={save}
					disabled={saving}
					class="min-h-12 rounded-xl bg-primary-700 text-sm font-medium text-white transition-all hover:bg-primary-800 active:scale-95 disabled:opacity-60 dark:bg-primary-600 dark:hover:bg-primary-700"
				>
					{saving ? 'Speichere…' : 'Speichern'}
				</button>
			</div>
		{/if}
	</section>

	<!-- Year in Pixels -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<div class="mb-3 flex items-center justify-between gap-3">
			<h2 class="text-sm font-semibold text-text-primary">Jahr in Pixeln</h2>
			<span class="text-xs text-text-secondary">
				Ø {formatScore(yearAverage)} · {yearEntries.length} Tage
			</span>
		</div>

		{#if years.length > 1}
			<div class="mb-3 flex gap-2 overflow-x-auto pb-1">
				{#each years as y (y)}
					<Chip selected={y === year} onclick={() => pickYear(y)}>{y}</Chip>
				{/each}
			</div>
		{/if}

		<YearInPixels {months} onselect={openDay} />

		<div class="mt-3 flex flex-wrap items-center gap-2">
			{#each [1, 2, 3, 4, 5] as score}
				<span class="inline-flex items-center gap-1 text-[11px] text-text-tertiary">
					<span class="inline-block h-3 w-3 rounded-sm {MOOD_CLASSES[score]}"></span>
					{MOOD_LABELS[score]}
				</span>
			{/each}
		</div>
		<p class="mt-2 text-[11px] text-text-tertiary">Tippe auf einen Tag, um ihn nachzutragen oder zu ändern.</p>
	</section>

	<!-- Aktivitaets-Statistik -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<div class="mb-3 flex items-center justify-between gap-3">
			<h2 class="text-sm font-semibold text-text-primary">Was beeinflusst deine Stimmung?</h2>
			<div class="flex gap-1.5">
				{#each [30, 90, 365] as days}
					<Chip selected={statsDays === days} onclick={() => (statsDays = days)}>{days} T</Chip>
				{/each}
			</div>
		</div>
		<MoodActivityStats entries={statsEntries} />
	</section>

	<!-- Wochentage -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Ø nach Wochentag</h2>
		<WeekdayAverages entries={statsEntries} />
	</section>
</div>

<MoodEntrySheet bind:open={sheetOpen} date={sheetDate} />
