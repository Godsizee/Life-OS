<script lang="ts">
	import { Sparkles } from '@lucide/svelte';
	import { formatDate } from '#lib/core/date.js';
	import { wert } from '#lib/core/einstellungen.js';
	import { formatMinutes } from '#lib/features/timetracking/stats.js';
	import { analyticsState } from '#lib/features/analytics/store.svelte.js';
	import { profileState } from '#lib/features/profile/store.svelte.js';
	import { workspaceState } from '#lib/features/workspace/store.svelte.js';
	import { shoppingState } from '#lib/features/shopping/store.svelte.js';
	import { healthState } from '#lib/features/health/store.svelte.js';
	import { notesState } from '#lib/features/notes/store.svelte.js';
	import { goalsState } from '#lib/features/goals/store.svelte.js';

	import ScoreRing from '#lib/features/analytics/components/ScoreRing.svelte';
	import Vorschlaege from '#lib/features/automationen/components/Vorschlaege.svelte';
	import DashboardCard from '#lib/features/dashboard/components/DashboardCard.svelte';
	import HealthTiles from '#lib/features/dashboard/components/HealthTiles.svelte';
	import WeekFocusCard from '#lib/features/dashboard/components/WeekFocusCard.svelte';
	import WelcomeModal from '#lib/features/dashboard/components/WelcomeModal.svelte';
	import FocusMiniCard from '#lib/features/focus/components/FocusMiniCard.svelte';
	import WorkoutMiniCard from '#lib/features/fitness/components/WorkoutMiniCard.svelte';
	import ShoppingList from '#lib/features/shopping/components/ShoppingList.svelte';
	import HinweisKarten from '#lib/system/components/HinweisKarten.svelte';
	import AgendaZeilen from '#lib/system/components/heute/AgendaZeilen.svelte';
	import CheckinBox from '#lib/system/components/heute/CheckinBox.svelte';
	import JetztKarte from '#lib/system/components/heute/JetztKarte.svelte';
	import RitualBand from '#lib/system/components/heute/RitualBand.svelte';
	import { heuteTagesplan } from '#lib/system/agenda-heute.js';
	import { ueberbuchtUm } from '#lib/system/heute-logik.js';
	import { scoreAnzeigen } from '#lib/system/einstellungen/score.js';

	import Anleitung from '#lib/ui/Anleitung.svelte';
	import Band from '#lib/ui/Band.svelte';
	import Box from '#lib/ui/Box.svelte';
	import Button from '#lib/ui/Button.svelte';
	import EmptyState from '#lib/ui/EmptyState.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import Skeleton from '#lib/ui/Skeleton.svelte';
	import { ShoppingCart, Notebook, Lock } from '@lucide/svelte';
	import { checklistProgress } from '#lib/features/notes/markdown.js';
	import { greetingFor } from '#lib/features/dashboard/greeting.js';

	let now = $state(new Date());
	$effect(() => {
		const i = setInterval(() => (now = new Date()), 60000);
		return () => clearInterval(i);
	});

	const greeting = $derived(greetingFor(now));
	// W10 — Banner ab Samstag statt nur sonntags; verschwindet, sobald der Review erledigt ist.
	const isReviewSeason = $derived(now.getDay() === 6 || now.getDay() === 0);
	const todayLabel = $derived(formatDate(now));

	const plan = $derived(heuteTagesplan(now));
	const leer = $derived(plan.zeitlich.length + plan.flexibel.length === 0);
	const ueberbucht = $derived(ueberbuchtUm(plan));

	const shoppingHighlights = $derived(shoppingState.items.filter((i) => !i.checked).slice(0, 5));
	const pinnedNotes = $derived(notesState.notes.filter((n) => n.pinned).slice(0, 3));

	// Reihenfolge der Widget-Kacheln: gespeicherte Auswahl, Termine und Routinen stehen jetzt im Tagesplan.
	const defaultCardOrder = ['shopping', 'health', 'notes'];
	const cardOrder = $derived(
		(profileState.settings.dashboard_card_order || defaultCardOrder).filter((c) =>
			defaultCardOrder.includes(c)
		)
	);
	const orderedCards = $derived([
		...cardOrder,
		...defaultCardOrder.filter((c) => !cardOrder.includes(c))
	]);
</script>

<svelte:head><title>Heute - Life OS</title></svelte:head>
<WelcomeModal />

<div class="space-y-6">
	<PageHeader title={greeting} subtitle="{todayLabel} · {plan.kapazitaet.satz}">
		{#snippet trailing()}
			{#if wert(scoreAnzeigen)}
				<a
					href="/analytics"
					class="transition-transform duration-300 hover:scale-105"
					aria-label="Details zum Score"
				>
					<ScoreRing score={analyticsState.todayScore} size={90} />
				</a>
			{/if}
		{/snippet}
	</PageHeader>

	<RitualBand jetzt={now} />

	{#if ueberbucht > 0}
		<Band variante="status">
			Dein Plan übersteigt die freie Zeit um {formatMinutes(ueberbucht)} — anpassen?
			{#snippet aktion()}
				<a
					href="/heute/planen?schritt=3"
					class="mono-label inline-flex min-h-[var(--ziel-min)] items-center underline decoration-2 underline-offset-4"
				>
					Plan anpassen
				</a>
			{/snippet}
		</Band>
	{/if}

	{#if leer}
		<Box>
			<div class="p-4">
				<Anleitung
					titel="Noch nichts geplant"
					was="Hier erscheinen Termine, geplante Aufgaben und offene Routinen des Tages."
				>
					{#snippet ersterSchritt()}
						<div class="flex flex-wrap justify-center gap-2">
							<a href="/?erfassen=1" class="contents"><Button>Erste Aufgabe</Button></a>
							<a href="/calendar" class="contents"
								><Button variant="sekundaer">Termin anlegen</Button></a
							>
						</div>
					{/snippet}
				</Anleitung>
			</div>
		</Box>
	{/if}

	<div class="grid items-start gap-6 lg:grid-cols-2">
		<div class="flex min-w-0 flex-col gap-6">
			<JetztKarte {plan} jetzt={now} />

			{#if plan.zeitlich.length > 0}
				<Box titel="Tagesplan">
					<AgendaZeilen eintraege={plan.zeitlich} />
				</Box>
			{/if}
		</div>

		<div class="flex min-w-0 flex-col gap-6">
			{#if plan.flexibel.length > 0}
				<Box titel="Flexibel heute">
					<AgendaZeilen eintraege={plan.flexibel} />
				</Box>
			{/if}

			<CheckinBox />

			<Vorschlaege />
			<HinweisKarten />

			{#if isReviewSeason && !goalsState.hatReviewDieseWoche}
				<a
					href="/review"
					class="box druckbar flex items-center gap-3 bg-flaeche p-4 text-sm font-semibold"
				>
					<Sparkles size={18} />
					<span>Zeit für deinen Weekly Review</span>
					<span class="ml-auto" aria-hidden="true">→</span>
				</a>
			{:else if goalsState.hatReviewDieseWoche}
				<a href="/review" class="mono-label text-text-3 hover:text-tinte">Weekly Review erledigt</a>
			{/if}
		</div>
	</div>

	<section aria-labelledby="widgets-titel" class="space-y-4">
		<h2 id="widgets-titel" class="mono-label text-text-3">Widgets</h2>
		<FocusMiniCard />
		<WorkoutMiniCard />
		<WeekFocusCard />

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each orderedCards as cardId (cardId)}
				{#if cardId === 'shopping'}
					<DashboardCard
						title="Einkaufshighlights"
						linkText="Alle Einkäufe"
						href="/shopping"
						onReset={() => shoppingState.load(workspaceState.workspace?.id || '')}
					>
						{#if shoppingState.loading}
							<div class="space-y-2"><Skeleton height="2rem" /><Skeleton height="2rem" /></div>
						{:else if shoppingHighlights.length > 0}
							<ShoppingList items={shoppingHighlights} />
						{:else}
							<EmptyState icon={ShoppingCart} title="Liste ist leer" size="sm" />
						{/if}
					</DashboardCard>
				{:else if cardId === 'health'}
					<DashboardCard
						title="Gesundheitstracker"
						linkText="Gesundheit öffnen"
						href="/health"
						onReset={() => healthState.load()}
					>
						{#if healthState.loading}
							<div class="grid grid-cols-2 gap-3">
								<Skeleton height="4rem" /><Skeleton height="4rem" />
							</div>
						{:else}
							<HealthTiles />
						{/if}
					</DashboardCard>
				{:else if cardId === 'notes'}
					<DashboardCard
						title="Angepinnte Notizen"
						linkText="Notizen öffnen"
						href="/notes"
						onReset={() => notesState.load(workspaceState.workspace?.id || '')}
					>
						{#if notesState.loading}
							<div class="space-y-2"><Skeleton height="2rem" /><Skeleton height="2rem" /></div>
						{:else if pinnedNotes.length > 0}
							<ul class="flex flex-col gap-2">
								{#each pinnedNotes as note (note.id)}
									{@const progress = checklistProgress(note.body ?? '')}
									<li
										class="flex items-center gap-2 rounded-lg border border-border-color bg-surface-2 px-3 py-2 text-xs font-semibold text-text-secondary"
									>
										{#if note.private}<Lock size={12} class="shrink-0 text-text-tertiary" />{/if}
										<span class="min-w-0 flex-1 truncate">{note.title}</span>
										{#if progress.total > 0}<span class="shrink-0 text-text-tertiary"
												>{progress.done}/{progress.total}</span
											>{/if}
									</li>
								{/each}
							</ul>
						{:else}
							<EmptyState icon={Notebook} title="Keine angepinnten Notizen" size="sm" />
						{/if}
					</DashboardCard>
				{/if}
			{/each}
		</div>
	</section>
</div>
