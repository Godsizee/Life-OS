<script lang="ts">
	import { moodState } from '$lib/features/mood/store.svelte';
	import MoodPicker from '$lib/features/mood/components/MoodPicker.svelte';
	import ActivityPicker from '$lib/features/mood/components/ActivityPicker.svelte';
	import YearInPixels from '$lib/features/mood/components/YearInPixels.svelte';
	import MoodEntrySheet from '$lib/features/mood/components/MoodEntrySheet.svelte';
	import MoodActivityStats from '$lib/features/mood/components/MoodActivityStats.svelte';
	import WeekdayAverages from '$lib/features/mood/components/WeekdayAverages.svelte';
	import MoodDistribution from '$lib/features/mood/components/MoodDistribution.svelte';
	import ActivityManagerSheet from '$lib/features/mood/components/ActivityManagerSheet.svelte';
	import MoodHealthCorrelation from '$lib/features/analytics/components/MoodHealthCorrelation.svelte';
	import { MOOD_LABELS, MOOD_EMOJIS } from '$lib/features/mood/types';
	import { MOOD_CLASSES } from '$lib/features/mood/colors';
	import { activityLabel } from '$lib/features/mood/activities';
	import {
		availableYears,
		averageByDaypart,
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
	import { Settings, Trash2, Sun, Sunset, Moon, Sunrise } from 'lucide-svelte';

	// ── Heute erfassen ──────────────────────────────────────────────
	let selectedScore = $state<number | null>(null);
	let note = $state('');
	let activities = $state<string[]>([]);
	let saving = $state(false);

	const todayEntries = $derived(moodState.todayEntries);

	async function save() {
		if (!selectedScore) return;
		saving = true;
		try {
			await moodState.save(selectedScore, note, activities);
			selectedScore = null;
			note = '';
			activities = [];
		} finally {
			saving = false;
		}
	}

	async function removeEntry(id: string) {
		await moodState.remove(id);
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

	// ── Sheets & Modals ─────────────────────────────────────────────
	let sheetOpen = $state(false);
	let sheetDate = $state(toISODate(new Date()));
	let managerOpen = $state(false);

	function openDay(date: string) {
		sheetDate = date;
		sheetOpen = true;
	}

	// ── Statistik-Zeitraum ──────────────────────────────────────────
	let statsDays = $state(90);
	const statsEntries = $derived(filterSince(moodState.entries, statsDays));
	const daypartAverages = $derived(averageByDaypart(statsEntries));
	const daypartIcons = [Sunrise, Sun, Sunset, Moon];
	const daypartLabels = ['Morgen', 'Mittag', 'Abend', 'Nacht'];
</script>

<svelte:head>
	<title>Stimmung - Life OS</title>
</svelte:head>

<PageHeader title="Wie geht's dir?" subtitle={formatDate(new Date())} />

<div class="flex flex-col gap-4 pb-8">
	<!-- Heute -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Stimmung heute</h2>

		{#if todayEntries.length > 0}
			<div class="mb-4 space-y-2">
				<p class="text-xs font-bold uppercase tracking-wider text-text-tertiary">
					Heutige Einträge ({todayEntries.length})
				</p>
				<ul class="flex flex-col gap-1.5">
					{#each todayEntries as entry (entry.id)}
						{@const d = new Date(entry.logged_at)}
						{@const formattedTime = isNaN(d.getTime())
							? ''
							: d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
						<li
							class="flex items-center justify-between gap-2 rounded-xl border border-border-color bg-surface-1 p-2.5"
						>
							<div class="flex items-center gap-2">
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
							</div>
							<button
								onclick={() => removeEntry(entry.id)}
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

		<p class="mb-2 text-xs font-medium text-text-secondary">
			{todayEntries.length > 0 ? 'Weiteren Eintrag hinzufügen:' : 'Neuer Eintrag:'}
		</p>

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
					{saving ? 'Speichere…' : 'Eintrag speichern'}
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

		<div class="overflow-x-auto">
			<YearInPixels {months} onselect={openDay} />
		</div>

		<div class="mt-3 flex flex-wrap items-center gap-2">
			{#each [1, 2, 3, 4, 5] as score (score)}
				<span class="inline-flex items-center gap-1 text-[11px] text-text-tertiary">
					<span class="inline-block h-3 w-3 rounded-sm {MOOD_CLASSES[score]}"></span>
					{MOOD_LABELS[score]}
				</span>
			{/each}
		</div>
		<p class="mt-2 text-[11px] text-text-tertiary">Tippe auf einen Tag, um ihn nachzutragen oder zu ändern.</p>

		<div class="mt-6 border-t border-border-color pt-4">
			<MoodDistribution entries={statsEntries} />
		</div>
	</section>

	<!-- Aktivitaets-Statistik -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<div class="mb-3 flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<h2 class="text-sm font-semibold text-text-primary">Was beeinflusst deine Stimmung?</h2>
				<button
					onclick={() => (managerOpen = true)}
					aria-label="Eigene Tags verwalten"
					class="p-1 text-text-tertiary hover:text-text-primary"
				>
					<Settings size={16} />
				</button>
			</div>
			<div class="flex gap-1.5">
				{#each [30, 90, 365] as days (days)}
					<Chip selected={statsDays === days} onclick={() => (statsDays = days)}>{days} T</Chip>
				{/each}
			</div>
		</div>
		<MoodActivityStats entries={statsEntries} />
	</section>

	<!-- Wochentage & Tageszeit -->
	<div class="grid gap-4 md:grid-cols-2">
		<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
			<h2 class="mb-3 text-sm font-semibold text-text-primary">Ø nach Wochentag</h2>
			<WeekdayAverages entries={statsEntries} />
		</section>

		<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
			<h2 class="mb-3 text-sm font-semibold text-text-primary">Ø nach Tageszeit</h2>
			<!-- Vier Spalten lassen bei 320px nur ~42px Innenbreite je Kachel - zu wenig
			     fuer "Morgen"/"Mittag". Unter 360px stehen sie deshalb zweispaltig. -->
			<div class="grid grid-cols-2 gap-2 xs:grid-cols-4">
				{#each daypartLabels as label, i (label)}
					{@const score = daypartAverages[i]}
					{@const IconComponent = daypartIcons[i]}
					<div class="flex min-w-0 flex-col items-center gap-1 rounded-xl bg-surface-1 p-2 text-center">
						<IconComponent size={16} class="shrink-0 text-text-tertiary" />
						<span class="w-full truncate text-[11px] text-text-secondary">{label}</span>
						<span class="text-sm font-bold text-text-primary">{formatScore(score)}</span>
					</div>
				{/each}
			</div>
		</section>
	</div>

	<!-- Stimmung & Körper (Gesundheit) -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<MoodHealthCorrelation days={statsDays} />
	</section>
</div>

<MoodEntrySheet bind:open={sheetOpen} date={sheetDate} />
<ActivityManagerSheet bind:open={managerOpen} />
