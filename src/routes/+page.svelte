<script lang="ts">
	import { formatDate } from '$lib/core/date';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	
	import ScoreRing from '$lib/features/analytics/components/ScoreRing.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import SuggestionCarousel from '$lib/features/suggestions/components/SuggestionCarousel.svelte';
	import DailyBrief from '$lib/features/dashboard/components/DailyBrief.svelte';
	import WelcomeModal from '$lib/features/dashboard/components/WelcomeModal.svelte';
	import QuickAddBar from '$lib/features/dashboard/components/QuickAddBar.svelte';
	import NextUpCard from '$lib/features/dashboard/components/NextUpCard.svelte';
	import WeekFocusCard from '$lib/features/dashboard/components/WeekFocusCard.svelte';
	import StreakBanner from '$lib/features/dashboard/components/StreakBanner.svelte';
	import HealthTiles from '$lib/features/dashboard/components/HealthTiles.svelte';
	import FocusMiniCard from '$lib/features/focus/components/FocusMiniCard.svelte';
	import DashboardCard from '$lib/features/dashboard/components/DashboardCard.svelte';
	import WorkoutMiniCard from '$lib/features/fitness/components/WorkoutMiniCard.svelte';
	
	import { Sparkles, Calendar, Flame, ShoppingCart, Activity, Notebook, Lock } from 'lucide-svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	
	import { calendarState } from '$lib/features/calendar/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { shoppingState } from '$lib/features/shopping/store.svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { notesState } from '$lib/features/notes/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	
	import EventItem from '$lib/features/calendar/components/EventItem.svelte';
	import HabitList from '$lib/features/habits/components/HabitList.svelte';
	import ShoppingList from '$lib/features/shopping/components/ShoppingList.svelte';
	
	import { isOpenToday } from '$lib/features/habits/streak';
	import { checklistProgress } from '$lib/features/notes/markdown';
	import { expandEvents } from '$lib/features/calendar/occurrences';
	import { greetingFor } from '$lib/features/dashboard/greeting';

	let now = $state(new Date());
	$effect(() => {
		const i = setInterval(() => (now = new Date()), 60000);
		return () => clearInterval(i);
	});

	const greeting = $derived(greetingFor(now));
	// W10 — Banner ab Samstag statt nur sonntags; verschwindet, sobald der Review erledigt ist.
	const isReviewSeason = $derived(now.getDay() === 6 || now.getDay() === 0);
	const todayLabel = $derived(formatDate(now));

	const todayStart = $derived(new Date(now.toDateString()));
	const todayEnd = $derived(new Date(todayStart.getTime() + 24 * 3600 * 1000 - 1));

	const todayEvents = $derived(
		expandEvents(calendarState.events, calendarState.overrides, todayStart, todayEnd)
	);

	const dueHabitsToday = $derived(
		habitsState.habits.filter((h) => !h.archived && isOpenToday(h, habitsState.entriesFor(h.id)))
	);
	
	const shoppingHighlights = $derived(shoppingState.items.filter((i) => !i.checked).slice(0, 5));
	const pinnedNotes = $derived(notesState.notes.filter((n) => n.pinned).slice(0, 3));

	const defaultCardOrder = ['calendar', 'habits', 'shopping', 'health', 'notes'];
	const cardOrder = $derived(profileState.settings.dashboard_card_order || defaultCardOrder);
	const orderedCards = $derived([...cardOrder, ...defaultCardOrder.filter(c => !cardOrder.includes(c))]);

	function handleKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		const isEditable = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable;
		if (e.key === 'n' && !isEditable) {
			e.preventDefault();
			(document.getElementById('quick-add-input') as HTMLInputElement)?.focus();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />
<svelte:head><title>Heute - Life OS</title></svelte:head>
<WelcomeModal />

<div class="space-y-6">
	<PageHeader title="{greeting} 👋" subtitle={todayLabel}>
		{#snippet trailing()}
			<a href="/analytics" class="transition-transform duration-300 hover:scale-105" aria-label="Details zum Score">
				<ScoreRing score={analyticsState.todayScore} size={90} />
			</a>
		{/snippet}
	</PageHeader>

	<DailyBrief />
	<FocusMiniCard />
	<WorkoutMiniCard />
	<SuggestionCarousel />
	<StreakBanner />

	{#if isReviewSeason && !goalsState.hatReviewDieseWoche}
		<a href="/review" class="flex items-center gap-3 rounded-2xl border border-primary-active/20 bg-primary-active-bg p-4 text-sm font-medium text-primary-active hover:opacity-90 transition-all premium-shadow">
			<Sparkles size={18} />
			<span>Zeit für deinen Weekly Review</span>
			<span class="ml-auto">→</span>
		</a>
	{:else if goalsState.hatReviewDieseWoche}
		<a href="/review" class="flex items-center gap-2 text-xs font-medium text-text-tertiary hover:text-text-secondary">
			<span>✓ Weekly Review erledigt</span>
		</a>
	{/if}

	<QuickAddBar />
	<WeekFocusCard />
	<NextUpCard />

	<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each orderedCards as cardId (cardId)}
			{#if cardId === 'calendar'}
				<DashboardCard title="Kalender heute" linkText="Kalender öffnen" href="/calendar" onReset={() => calendarState.load(workspaceState.workspace?.id || '')}>
					{#if calendarState.loading}
						<div class="space-y-2"><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /></div>
					{:else if todayEvents.length > 0}
						<ul class="flex flex-col gap-2">
							{#each todayEvents as occ (occ.key)}
								<EventItem occurrence={occ} event={occ.event} />
							{/each}
						</ul>
					{:else}
						<EmptyState icon={Calendar} title="Keine Termine" size="sm" />
					{/if}
				</DashboardCard>
			{:else if cardId === 'habits'}
				<DashboardCard title="Gewohnheiten heute" linkText="Routinen öffnen" href="/habits" onReset={() => habitsState.load(workspaceState.workspace?.id || '')}>
					{#if habitsState.loading}
						<div class="space-y-2"><Skeleton height="2rem" /><Skeleton height="2rem" /><Skeleton height="2rem" /></div>
					{:else if dueHabitsToday.length > 0}
						<HabitList habits={dueHabitsToday} />
					{:else}
						<EmptyState icon={Flame} title="Keine ausstehenden Routinen" size="sm" />
					{/if}
				</DashboardCard>
			{:else if cardId === 'shopping'}
				<DashboardCard title="Einkaufshighlights" linkText="Alle Einkäufe" href="/shopping" onReset={() => shoppingState.load(workspaceState.workspace?.id || '')}>
					{#if shoppingState.loading}
						<div class="space-y-2"><Skeleton height="2rem" /><Skeleton height="2rem" /></div>
					{:else if shoppingHighlights.length > 0}
						<ShoppingList items={shoppingHighlights} />
					{:else}
						<EmptyState icon={ShoppingCart} title="Liste ist leer" size="sm" />
					{/if}
				</DashboardCard>
			{:else if cardId === 'health'}
				<DashboardCard title="Gesundheitstracker" linkText="Gesundheit öffnen" href="/health" onReset={() => healthState.load()}>
					{#if healthState.loading}
						<div class="grid grid-cols-2 gap-3"><Skeleton height="4rem" /><Skeleton height="4rem" /></div>
					{:else}
						<HealthTiles />
					{/if}
				</DashboardCard>
			{:else if cardId === 'notes'}
				<DashboardCard title="Angepinnte Notizen" linkText="Notizen öffnen" href="/notes" onReset={() => notesState.load(workspaceState.workspace?.id || '')}>
					{#if notesState.loading}
						<div class="space-y-2"><Skeleton height="2rem" /><Skeleton height="2rem" /></div>
					{:else if pinnedNotes.length > 0}
						<ul class="flex flex-col gap-2">
							{#each pinnedNotes as note (note.id)}
								{@const progress = checklistProgress(note.body ?? '')}
								<li class="flex items-center gap-2 rounded-lg border border-border-color bg-surface-2 px-3 py-2 text-xs font-semibold text-text-secondary">
									{#if note.private}<Lock size={12} class="shrink-0 text-text-tertiary" />{/if}
									<span class="min-w-0 flex-1 truncate">{note.title}</span>
									{#if progress.total > 0}<span class="shrink-0 text-text-tertiary">{progress.done}/{progress.total}</span>{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<EmptyState icon={Notebook} title="Keine angepinnten Notizen" size="sm" />
					{/if}
				</DashboardCard>
			{/if}
		{/each}
	</section>
</div>
