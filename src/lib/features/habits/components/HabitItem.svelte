<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { Habit } from '../types';
	import { habitsState } from '../store.svelte';
	import { calculateStreak } from '../streak';

	let { habit }: { habit: Habit } = $props();

	const doneToday = $derived(habitsState.isLoggedToday(habit.id));
	const streak = $derived(calculateStreak(habit.schedule, habitsState.logsFor(habit.id)));

	function toggle() {
		habitsState.toggleToday(habit.id);
	}
</script>

<li class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
	<button
		onclick={toggle}
		aria-label="Heute erledigt"
		class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 active:scale-95 transition-transform {doneToday
			? 'border-emerald-600 bg-emerald-600'
			: 'border-slate-300'}"
	>
		{#if doneToday}<span class="text-xs text-white">✓</span>{/if}
	</button>
	<div class="min-w-0 flex-1">
		<p class="truncate text-slate-900">{habit.name}</p>
		{#if streak > 0}
			<p class="text-xs text-emerald-600">{streak} {streak === 1 ? 'Tag' : 'Tage'} Streak</p>
		{/if}
	</div>
	<button
		onclick={() => habitsState.archiveHabit(habit.id)}
		aria-label="Archivieren"
		class="shrink-0 text-slate-400 active:text-red-600"
	>
		<Trash2 size={18} />
	</button>
</li>
