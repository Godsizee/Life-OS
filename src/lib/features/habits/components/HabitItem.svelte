<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { Habit } from '../types';
	import { habitsState } from '../store.svelte';
	import { calculateStreak } from '../streak';
	import ListRow from '$lib/ui/ListRow.svelte';
	import CheckCircle from '$lib/ui/CheckCircle.svelte';

	let { habit }: { habit: Habit } = $props();

	const doneToday = $derived(habitsState.isLoggedToday(habit.id));
	const streak = $derived(calculateStreak(habit.schedule, habitsState.logsFor(habit.id)));

	function toggle() {
		habitsState.toggleToday(habit.id);
	}
</script>

<ListRow>
	{#snippet leading()}
		<CheckCircle checked={doneToday} ontoggle={toggle} />
	{/snippet}
	<p class="truncate text-text-primary">{habit.name}</p>
	{#if streak > 0}
		<p class="text-xs text-accent-600 dark:text-accent-400">{streak} {streak === 1 ? 'Tag' : 'Tage'} Streak</p>
	{/if}
	{#snippet trailing()}
		<button
			onclick={() => habitsState.archiveHabit(habit.id)}
			aria-label="Archivieren"
			class="shrink-0 text-text-tertiary active:text-red-600 dark:active:text-red-400"
		>
			<Trash2 size={18} />
		</button>
	{/snippet}
</ListRow>
