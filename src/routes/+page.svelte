<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { toISODate, formatDate, formatShortDate } from '$lib/core/date';
	import { toastState } from '$lib/core/toast.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { notesState } from '$lib/features/notes/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { isDueOn, calculateStreak } from '$lib/features/habits/streak';
	import { calendarState } from '$lib/features/calendar/store.svelte';
	import { shoppingState } from '$lib/features/shopping/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { moodState } from '$lib/features/mood/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { linksState } from '$lib/features/links/store.svelte';
	import { focusState } from '$lib/features/focus/store.svelte';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { rankTasks } from '$lib/features/dashboard/scoring';
	import { parseNLPInput } from '$lib/core/nlp-parse';

	import ScoreRing from '$lib/features/analytics/components/ScoreRing.svelte';
	import SuggestionCarousel from '$lib/features/suggestions/components/SuggestionCarousel.svelte';
	import DailyBrief from '$lib/features/dashboard/components/DailyBrief.svelte';
	import EventItem from '$lib/features/calendar/components/EventItem.svelte';
	import HabitList from '$lib/features/habits/components/HabitList.svelte';
	import ShoppingList from '$lib/features/shopping/components/ShoppingList.svelte';
	import { Plus, Flame, Sparkles, Smile, Droplet, Moon, Activity, Calendar, ShoppingCart, CheckSquare, Check, Notebook, Target } from 'lucide-svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			tasksState.load(id);
			notesState.load(id);
			habitsState.load(id);
			calendarState.load(id);
			shoppingState.load(id);
			goalsState.load(id);
			fitnessState.load(id);
			linksState.load(id);
			healthState.load();
			moodState.load();
			analyticsState.load();
		}
		focusState.loadToday();
	});

	onDestroy(() => {
		tasksState.unload();
		notesState.unload();
		habitsState.unload();
		calendarState.unload();
		shoppingState.unload();
		goalsState.unload();
		fitnessState.unload();
		linksState.unload();
		healthState.unload();
		moodState.unload();
		analyticsState.unload();
	});

	const today = toISODate(new Date());

	// ── Streak-Banner ─────────────────────────────────────────────────
	const longestStreak = $derived(
		habitsState.habits.reduce((max, h) => {
			const streak = calculateStreak(h.schedule, habitsState.logsFor(h.id));
			return streak > max.streak ? { streak, name: h.name } : max;
		}, { streak: 0, name: '' })
	);

	// ── Sonstige Sektionen ────────────────────────────────────────────
	const dueHabitsToday = $derived(
		habitsState.habits.filter(
			(h) => isDueOn(h.schedule, new Date()) && !habitsState.isLoggedToday(h.id)
		)
	);
	const todayEvents = $derived(
		calendarState.events
			.filter((e) => toISODate(new Date(e.start)) === today)
			.sort((a, b) => a.start.localeCompare(b.start))
	);
	const shoppingHighlights = $derived(shoppingState.items.filter((i) => !i.checked).slice(0, 5));
	const pinnedNotes = $derived(notesState.notes.filter((n) => n.pinned).slice(0, 3));

	// ── NLP-Quick-Add ────────────────────────────────────────────────
	let quickAdd = $state('');
	const parsedResult = $derived(quickAdd ? parseNLPInput(quickAdd) : null);
	
	const parsedBadge = $derived((): { text: string; color: string; icon: any } | null => {
		if (!parsedResult) return null;
		switch (parsedResult.type) {
			case 'task': return { text: 'Aufgabe', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', icon: CheckSquare };
			case 'shopping': return { text: 'Einkauf', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900', icon: ShoppingCart };
			case 'event': return { text: 'Kalender', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900', icon: Calendar };
			case 'health': return { text: 'Gesundheit', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900', icon: Activity };
			case 'habit': return { text: 'Routine', color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900', icon: Flame };
			case 'note': return { text: 'Notiz', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900', icon: Notebook };
			case 'goal': return { text: 'Ziel', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900', icon: Target };
			default: return null;
		}
	});

	async function submitQuickAdd(e: SubmitEvent) {
		e.preventDefault();
		const text = quickAdd.trim();
		if (!text || !parsedResult) return;

		try {
			switch (parsedResult.type) {
				case 'task':
					await tasksState.addTask({
						title: parsedResult.parsed.title,
						priority: parsedResult.parsed.priority
					});
					toastState.success('Aufgabe hinzugefügt');
					break;
				case 'shopping':
					await shoppingState.addItem({
						name: parsedResult.parsed.name,
						qty: parsedResult.parsed.quantity
					});
					toastState.success('Zum Einkauf hinzugefügt');
					break;
				case 'event':
					const start = parsedResult.parsed.due_at;
					const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
					await calendarState.addEvent({
						title: parsedResult.parsed.title,
						start,
						end
					});
					toastState.success('Kalendertermin erstellt');
					break;
				case 'health':
					await healthState.save({
						weight_kg: parsedResult.parsed.weight_kg ?? healthState.todayEntry?.weight_kg ?? null,
						sleep_h: parsedResult.parsed.sleep_h ?? healthState.todayEntry?.sleep_h ?? null,
						water_glasses: parsedResult.parsed.water_glasses ?? healthState.todayEntry?.water_glasses ?? null,
						energy: parsedResult.parsed.energy ?? healthState.todayEntry?.energy ?? null
					});
					toastState.success('Gesundheitseintrag aktualisiert');
					break;
				case 'habit':
					await habitsState.toggleToday(parsedResult.parsed.habitId);
					toastState.success(`Routine "${parsedResult.parsed.name}" geloggt`);
					break;
				case 'note':
					await notesState.addNote({
						title: parsedResult.parsed.title,
						body: parsedResult.parsed.body || undefined
					});
					toastState.success('Notiz erstellt');
					break;
				case 'goal':
					await goalsState.addGoal({
						title: parsedResult.parsed.title
					});
					toastState.success('Ziel erstellt');
					break;
			}
			quickAdd = '';
			await analyticsState.saveTodayScore();
		} catch (err) {
			console.error(err);
			toastState.error('Eintrag fehlgeschlagen');
		}
	}

	// Keyboard shortcut 'n' → Fokus auf Quick-Add
	// Guards: not in any focusable/editable element, including contenteditable
	function handleKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		const isEditable =
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement ||
			target.isContentEditable;
		if (e.key === 'n' && !isEditable) {
			e.preventDefault();
			(document.getElementById('quick-add-input') as HTMLInputElement)?.focus();
		}
	}

	const greetings = ['Guten Sonntag', 'Guten Montag', 'Guten Dienstag', 'Guten Mittwoch', 'Guten Donnerstag', 'Guten Freitag', 'Guten Samstag'];
	// $derived so it re-evaluates after midnight without a page reload
	const greeting = $derived(greetings[new Date().getDay()]);
	const isSunday = $derived(new Date().getDay() === 0);

	// ── "Was jetzt?" ──────────────────────────────────────────────────
	const nextTask = $derived(rankTasks(tasksState.tasks)[0] ?? null);

	// ── Header date string ────────────────────────────────────────────
	const todayLabel = $derived(formatDate(new Date()));

	// ── Health Quick Log ──────────────────────────────────────────────
	async function addWater() {
		const current = healthState.todayEntry?.water_glasses ?? 0;
		await healthState.save({
			weight_kg: healthState.todayEntry?.weight_kg ?? null,
			sleep_h: healthState.todayEntry?.sleep_h ?? null,
			water_glasses: current + 1,
			energy: healthState.todayEntry?.energy ?? null
		});
		await analyticsState.saveTodayScore();
		toastState.success('Wasser geloggt');
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Heute - Life OS</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header Zone -->
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-extrabold tracking-tight text-text-primary">{greeting} 👋</h1>
			<p class="text-sm font-medium text-text-secondary">{todayLabel}</p>
		</div>

		<!-- Clickable Score Ring linked to Analytics Page -->
		<a href="/analytics" class="transition-transform duration-300 hover:scale-105" aria-label="Details zum Score">
			<ScoreRing score={analyticsState.todayScore()} size={90} />
		</a>
	</header>

	<!-- Daily Brief (Welle 5.6) -->
	<DailyBrief />

	<!-- Suggestions Carousel -->
	<SuggestionCarousel />

	<!-- Streak-Banner -->
	{#if longestStreak.streak >= 2}
		<div class="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-850 dark:bg-amber-950/20 dark:text-amber-400 premium-shadow border border-amber-100 dark:border-amber-900/50">
			<Flame class="text-amber-500 animate-pulse" size={18} />
			<div>
				<span class="font-bold">{longestStreak.streak} Tage Streak!</span>
				<span class="opacity-80">Weiter so mit "{longestStreak.name}".</span>
			</div>
		</div>
	{/if}

	<!-- Weekly-Review-Hint (Sunday only) -->
	{#if isSunday}
		<a href="/review" class="flex items-center gap-3 rounded-2xl border border-primary-active/20 bg-primary-active-bg p-4 text-sm font-medium text-primary-active hover:opacity-90 transition-all premium-shadow">
			<Sparkles size={18} />
			<span>Heute ist Sonntag — Zeit für deinen Weekly Review</span>
			<span class="ml-auto">→</span>
		</a>
	{/if}

	<!-- Quick-Add Form with Live NLP Parsing Badge -->
	<form onsubmit={submitQuickAdd} class="relative space-y-2">
		<div class="relative flex items-center">
			<input
				id="quick-add-input"
				bind:value={quickAdd}
				placeholder="Schnelleingabe… (z.B. 3x Eier, Morgen 10:00 Meeting, 75kg, Laufen) (Taste n)"
				class="min-h-12 w-full rounded-2xl border border-border-color bg-surface-0 pl-4 pr-12 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none premium-shadow"
			/>
			<button
				type="submit"
				class="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 active:scale-95 transition-all"
			>
				<Plus size={18} />
			</button>
		</div>

		<!-- Parsing Badge -->
		<div class="px-1">
			{#if parsedBadge()}
				{@const Badge = parsedBadge()!}
				{@const BadgeIcon = Badge.icon}
				<span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold {Badge.color}">
					<BadgeIcon size={12} />
					<span>Erkannt: {Badge.text}</span>
				</span>
			{/if}
		</div>
	</form>

	<!-- "Was jetzt?" Recommendation block -->
	{#if nextTask}
		<section class="space-y-2">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Was jetzt?</h2>
			<div class="rounded-2xl border border-primary-active/20 bg-primary-active-bg/50 p-4 premium-shadow">
				<div class="flex items-start gap-4">
					<button
						onclick={async () => {
							await tasksState.setStatus(nextTask.id, 'done');
							await analyticsState.saveTodayScore();
							toastState.success(`"${nextTask.title}" erledigt ✓`);
						}}
						class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary-active bg-surface-0 text-primary-active transition-all hover:bg-primary-active-bg active:scale-90"
						aria-label="Erledigt"
					>
						<Check size={12} strokeWidth={2.5} />
					</button>
					
					<div class="min-w-0 flex-1">
						<p class="font-bold text-text-primary leading-snug">{nextTask.title}</p>
						{#if nextTask.due_at}
							<p class="mt-1 text-xs text-text-tertiary">
								Fällig: {formatShortDate(nextTask.due_at)}
							</p>
						{/if}
						{#if nextTask.goal_id}
							{@const linkedGoal = goalsState.goals.find(g => g.id === nextTask.goal_id)}
							{#if linkedGoal}
								<p class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-active">
									<span>🎯</span> <span>{linkedGoal.title}</span>
								</p>
							{/if}
						{/if}
					</div>
					
					<a href="/tasks" class="shrink-0 text-xs font-semibold text-primary-active hover:underline">Alle</a>
				</div>
			</div>
		</section>
	{/if}

	<!-- Dashboard Cards Grid -->
	<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<!-- Today Events Card -->
		<svelte:boundary onerror={(err) => console.error('Error in Calendar card:', err)}>
			<div class="glass-card rounded-2xl p-5 premium-shadow flex flex-col justify-between min-h-[220px]">
				<div>
					<h3 class="font-bold text-text-primary text-sm tracking-tight mb-3">Kalender heute</h3>
					{#if calendarState.loading}
						<div class="space-y-2">
							<Skeleton height="2.5rem" />
							<Skeleton height="2.5rem" />
						</div>
					{:else}
						{#if todayEvents.length > 0}
							<ul class="flex flex-col gap-2">
								{#each todayEvents as event (event.id)}
									<EventItem {event} />
								{/each}
							</ul>
						{:else}
							<div class="flex flex-col items-center justify-center py-6 text-center text-text-tertiary">
								<Calendar class="text-text-secondary opacity-30 mb-2" size={32} />
								<p class="text-xs font-semibold">Keine Termine für heute</p>
							</div>
						{/if}
					{/if}
				</div>
				<a href="/calendar" class="mt-4 text-xs font-bold text-primary-active hover:underline inline-block">Kalender öffnen →</a>
			</div>
			{#snippet failed(error, reset)}
				<div class="glass-card rounded-2xl p-5 premium-shadow border border-red-500/20 text-center flex flex-col justify-center items-center min-h-[220px]">
					<p class="text-sm font-bold text-red-600 dark:text-red-400">Kalender Fehler</p>
					<button onclick={reset} class="mt-2 text-xs font-bold text-primary-active underline">Erneut versuchen</button>
				</div>
			{/snippet}
		</svelte:boundary>

		<!-- Habits Card -->
		<svelte:boundary onerror={(err) => console.error('Error in Habits card:', err)}>
			<div class="glass-card rounded-2xl p-5 premium-shadow flex flex-col justify-between min-h-[220px]">
				<div>
					<h3 class="font-bold text-text-primary text-sm tracking-tight mb-3">Gewohnheiten heute</h3>
					{#if habitsState.loading}
						<div class="space-y-2">
							<Skeleton height="2rem" />
							<Skeleton height="2rem" />
							<Skeleton height="2rem" />
						</div>
					{:else}
						{#if dueHabitsToday.length > 0}
							<HabitList habits={dueHabitsToday} />
						{:else}
							<div class="flex flex-col items-center justify-center py-6 text-center text-text-tertiary">
								<Flame class="text-text-secondary opacity-30 mb-2" size={32} />
								<p class="text-xs font-semibold">Keine ausstehenden Routinen</p>
							</div>
						{/if}
					{/if}
				</div>
				<a href="/habits" class="mt-4 text-xs font-bold text-primary-active hover:underline inline-block">Routinen öffnen →</a>
			</div>
			{#snippet failed(error, reset)}
				<div class="glass-card rounded-2xl p-5 premium-shadow border border-red-500/20 text-center flex flex-col justify-center items-center min-h-[220px]">
					<p class="text-sm font-bold text-red-600 dark:text-red-400">Habits Fehler</p>
					<button onclick={reset} class="mt-2 text-xs font-bold text-primary-active underline">Erneut versuchen</button>
				</div>
			{/snippet}
		</svelte:boundary>

		<!-- Shopping Card -->
		<svelte:boundary onerror={(err) => console.error('Error in Shopping card:', err)}>
			<div class="glass-card rounded-2xl p-5 premium-shadow flex flex-col justify-between min-h-[220px]">
				<div>
					<h3 class="font-bold text-text-primary text-sm tracking-tight mb-3">Einkaufshighlights</h3>
					{#if shoppingState.loading}
						<div class="space-y-2">
							<Skeleton height="2rem" />
							<Skeleton height="2rem" />
						</div>
					{:else}
						{#if shoppingHighlights.length > 0}
							<ShoppingList items={shoppingHighlights} />
						{:else}
							<div class="flex flex-col items-center justify-center py-6 text-center text-text-tertiary">
								<ShoppingCart class="text-text-secondary opacity-30 mb-2" size={32} />
								<p class="text-xs font-semibold">Einkaufsliste ist leer</p>
							</div>
						{/if}
					{/if}
				</div>
				<a href="/shopping" class="mt-4 text-xs font-bold text-primary-active hover:underline inline-block">Alle Einkäufe →</a>
			</div>
			{#snippet failed(error, reset)}
				<div class="glass-card rounded-2xl p-5 premium-shadow border border-red-500/20 text-center flex flex-col justify-center items-center min-h-[220px]">
					<p class="text-sm font-bold text-red-600 dark:text-red-400">Einkauf Fehler</p>
					<button onclick={reset} class="mt-2 text-xs font-bold text-primary-active underline">Erneut versuchen</button>
				</div>
			{/snippet}
		</svelte:boundary>

		<!-- Health Quick Log Panel -->
		<svelte:boundary onerror={(err) => console.error('Error in Health card:', err)}>
			<div class="glass-card rounded-2xl p-5 premium-shadow flex flex-col justify-between min-h-[220px]">
				<div class="space-y-4">
					<h3 class="font-bold text-text-primary text-sm tracking-tight">Gesundheitstracker</h3>
					{#if healthState.loading}
						<div class="grid grid-cols-2 gap-3">
							<Skeleton height="4rem" />
							<Skeleton height="4rem" />
						</div>
					{:else}
						<div class="grid grid-cols-2 gap-3">
							<!-- Water intake -->
							<button
								onclick={addWater}
								class="flex flex-col items-center justify-center p-3 rounded-xl border border-border-color bg-surface-2 hover:bg-surface-3 active:scale-95 transition-all text-center"
							>
								<Droplet class="text-blue-500 mb-1" size={20} />
								<span class="text-xs font-bold text-text-primary">Wasser</span>
								<span class="text-[10px] text-text-tertiary mt-0.5">{healthState.todayEntry?.water_glasses ?? 0} Gläser</span>
							</button>

							<!-- Sleep time info -->
							<div class="flex flex-col items-center justify-center p-3 rounded-xl border border-border-color bg-surface-2 text-center">
								<Moon class="text-purple-500 mb-1" size={20} />
								<span class="text-xs font-bold text-text-primary">Schlaf</span>
								<span class="text-[10px] text-text-tertiary mt-0.5">{healthState.todayEntry?.sleep_h ?? 0} Std.</span>
							</div>
						</div>
					{/if}
				</div>
				<a href="/health" class="text-xs font-bold text-primary-active hover:underline inline-block mt-4">Gesundheit öffnen →</a>
			</div>
			{#snippet failed(error, reset)}
				<div class="glass-card rounded-2xl p-5 premium-shadow border border-red-500/20 text-center flex flex-col justify-center items-center min-h-[220px]">
					<p class="text-sm font-bold text-red-600 dark:text-red-400">Gesundheit Fehler</p>
					<button onclick={reset} class="mt-2 text-xs font-bold text-primary-active underline">Erneut versuchen</button>
				</div>
			{/snippet}
		</svelte:boundary>

		<!-- Pinned Notes Card -->
		<svelte:boundary onerror={(err) => console.error('Error in Notes card:', err)}>
			<div class="glass-card rounded-2xl p-5 premium-shadow flex flex-col justify-between min-h-[220px]">
				<div>
					<h3 class="font-bold text-text-primary text-sm tracking-tight mb-3">Angepinnte Notizen</h3>
					{#if notesState.loading}
						<div class="space-y-2">
							<Skeleton height="2rem" />
							<Skeleton height="2rem" />
						</div>
					{:else}
						{#if pinnedNotes.length > 0}
							<ul class="flex flex-col gap-2">
								{#each pinnedNotes as note (note.id)}
									<li class="truncate text-xs font-semibold text-text-secondary bg-surface-2 px-3 py-2 rounded-lg border border-border-color">
										{note.title}
									</li>
								{/each}
							</ul>
						{:else}
							<div class="flex flex-col items-center justify-center py-6 text-center text-text-tertiary">
								<Notebook class="text-text-secondary opacity-30 mb-2" size={32} />
								<p class="text-xs font-semibold">Keine angepinnten Notizen</p>
							</div>
						{/if}
					{/if}
				</div>
				<a href="/notes" class="mt-4 text-xs font-bold text-primary-active hover:underline inline-block">Notizen öffnen →</a>
			</div>
			{#snippet failed(error, reset)}
				<div class="glass-card rounded-2xl p-5 premium-shadow border border-red-500/20 text-center flex flex-col justify-center items-center min-h-[220px]">
					<p class="text-sm font-bold text-red-600 dark:text-red-400">Notizen Fehler</p>
					<button onclick={reset} class="mt-2 text-xs font-bold text-primary-active underline">Erneut versuchen</button>
				</div>
			{/snippet}
		</svelte:boundary>
	</section>
</div>
