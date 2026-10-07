<script lang="ts">
	import { Flame } from '@lucide/svelte';
	import { habitsState } from '#lib/features/habits/store.svelte.js';
	import { calculateStreak } from '#lib/features/habits/streak.js';

	const longestStreak = $derived(
		habitsState.habits.reduce(
			(max, h) => {
				const streak = calculateStreak(h, habitsState.entriesFor(h.id));
				return streak > max.streak ? { streak, name: h.name } : max;
			},
			{ streak: 0, name: '' }
		)
	);
</script>

{#if longestStreak.streak >= 2}
	<div
		class="premium-shadow flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400"
	>
		<Flame class="animate-pulse text-amber-500" size={18} />
		<div>
			<span class="font-bold">{longestStreak.streak} Tage Streak!</span>
			<span class="opacity-80">Weiter so mit "{longestStreak.name}".</span>
		</div>
	</div>
{/if}
