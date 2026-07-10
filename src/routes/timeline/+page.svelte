<script lang="ts">
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { moodState } from '$lib/features/mood/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { calendarState } from '$lib/features/calendar/store.svelte';
	import { Calendar, CheckSquare, Flame, Heart, Smile, Target, Notebook } from 'lucide-svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			tasksState.load(id);
			habitsState.load(id);
			moodState.load();
			goalsState.load(id);
			healthState.load();
			calendarState.load(id);
		}
	});

	interface TimelineItem {
		id: string;
		date: string;
		title: string;
		description?: string;
		icon: any;
		color: string;
		bg: string;
		module: string;
	}

	// Aggregate activities
	const timelineItems = $derived((): TimelineItem[] => {
		const items: TimelineItem[] = [];

		// 1. Completed Tasks
		tasksState.tasks
			.filter((t) => t.status === 'done' && t.updated_at)
			.forEach((t) => {
				const date = t.updated_at.split('T')[0];
				items.push({
					id: `task_${t.id}`,
					date,
					title: `Aufgabe abgeschlossen: "${t.title}"`,
					icon: CheckSquare,
					color: 'text-blue-500',
					bg: 'bg-blue-50 dark:bg-blue-950/20',
					module: 'Tasks'
				});
			});

		// 2. Logged Habits
		habitsState.logs.forEach((log) => {
			const habit = habitsState.habits.find((h) => h.id === log.habit_id);
			if (habit) {
				items.push({
					id: `habit_${log.id}`,
					date: log.date,
					title: `Routine erledigt: "${habit.name}"`,
					icon: Flame,
					color: 'text-pink-500',
					bg: 'bg-pink-50 dark:bg-pink-950/20',
					module: 'Habits'
				});
			}
		});

		// 3. Mood Entries
		moodState.entries.forEach((m) => {
			items.push({
				id: `mood_${m.id}`,
				date: m.date,
				title: `Stimmung eingetragen: ${m.score}/5`,
				description: m.note ?? undefined,
				icon: Smile,
				color: 'text-amber-500',
				bg: 'bg-amber-50 dark:bg-amber-950/20',
				module: 'Mood'
			});
		});

		// 4. Goals Completed
		goalsState.goals.forEach((g) => {
			if (g.status === 'done') {
				const date = g.updated_at.split('T')[0];
				items.push({
					id: `goal_${g.id}`,
					date,
					title: `🎯 Ziel erreicht! "${g.title}"`,
					description: g.description ?? undefined,
					icon: Target,
					color: 'text-indigo-500',
					bg: 'bg-indigo-50 dark:bg-indigo-950/20',
					module: 'Goals'
				});
			}
		});

		// 5. Health Logs
		healthState.entries.forEach((h) => {
			const details: string[] = [];
			if (h.weight_kg) details.push(`${h.weight_kg} kg`);
			if (h.sleep_h) details.push(`${h.sleep_h} Std. Schlaf`);
			if (h.water_glasses) details.push(`${h.water_glasses} Gläser Wasser`);
			if (details.length > 0) {
				items.push({
					id: `health_${h.id}`,
					date: h.date,
					title: 'Gesundheitswerte erfasst',
					description: details.join(' · '),
					icon: Heart,
					color: 'text-emerald-500',
					bg: 'bg-emerald-50 dark:bg-emerald-950/20',
					module: 'Health'
				});
			}
		});

		// Sort by Date descending
		return items.sort((a, b) => b.date.localeCompare(a.date));
	});

	// Group items by date
	const groupedTimeline = $derived((): { date: string; items: TimelineItem[] }[] => {
		const raw = timelineItems();
		const groups: Record<string, TimelineItem[]> = {};
		
		raw.forEach((item) => {
			if (!groups[item.date]) groups[item.date] = [];
			groups[item.date].push(item);
		});

		return Object.entries(groups)
			.map(([date, items]) => ({ date, items }))
			.sort((a, b) => b.date.localeCompare(a.date));
	});

	let filterModule = $state<string>('all');
</script>

<svelte:head>
	<title>Timeline - Aktivitätenverlauf</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-extrabold tracking-tight text-text-primary">Timeline</h1>
			<p class="text-sm font-medium text-text-secondary">Verfolge all deine Aktivitäten und Fortschritte chronologisch.</p>
		</div>

		<!-- Filter Chip-row -->
		<div class="flex gap-2 overflow-x-auto pb-1">
			<button
				onclick={() => filterModule = 'all'}
				class="rounded-xl px-3 py-1.5 text-xs font-bold border transition-all
					{filterModule === 'all' 
						? 'bg-primary-700 text-white border-primary-700 dark:bg-primary-600 dark:border-primary-600' 
						: 'bg-surface-0 text-text-secondary border-border-color hover:bg-surface-1'}"
			>
				Alle
			</button>
			{#each ['Tasks', 'Habits', 'Mood', 'Goals', 'Health'] as mod}
				<button
					onclick={() => filterModule = mod}
					class="rounded-xl px-3 py-1.5 text-xs font-bold border transition-all
						{filterModule === mod 
							? 'bg-primary-700 text-white border-primary-700 dark:bg-primary-600 dark:border-primary-600' 
							: 'bg-surface-0 text-text-secondary border-border-color hover:bg-surface-1'}"
				>
					{mod}
				</button>
			{/each}
		</div>
	</div>

	<!-- Timeline List -->
	<div class="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-color">
		{#each groupedTimeline() as group (group.date)}
			{@const filtered = group.items.filter(item => filterModule === 'all' || item.module === filterModule)}
			{#if filtered.length > 0}
				<div class="space-y-4">
					<!-- Date Bubble Header -->
					<div class="relative z-10 flex items-center">
						<span class="rounded-xl bg-surface-3 px-3 py-1 text-xs font-extrabold text-text-primary border border-border-color premium-shadow">
							{new Date(group.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
						</span>
					</div>

					<!-- Items in group -->
					<div class="pl-12 space-y-4">
						{#each filtered as item (item.id)}
							{@const Icon = item.icon}
							<div class="glass-card relative flex items-start gap-4 rounded-2xl p-4 premium-shadow">
								<!-- Left timeline dot connector -->
								<div class="absolute -left-12 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-surface-0 border-2 border-border-color text-xs">
									<div class="h-2.5 w-2.5 rounded-full {item.color.replace('text', 'bg')}"></div>
								</div>

								<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {item.bg} {item.color}">
									<Icon size={18} />
								</div>
								
								<div class="space-y-1 min-w-0 flex-1">
									<h4 class="text-sm font-bold text-text-primary">{item.title}</h4>
									{#if item.description}
										<p class="text-xs text-text-secondary">{item.description}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{:else}
			<div class="flex flex-col items-center justify-center py-12 text-center text-text-tertiary">
				<Notebook size={48} class="text-text-tertiary mb-2" />
				<span class="text-sm">Keine Aktivitäten aufgezeichnet</span>
			</div>
		{/each}
	</div>
</div>
