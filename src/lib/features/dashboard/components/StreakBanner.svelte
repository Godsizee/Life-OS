<script lang="ts">
	import { Flame } from 'lucide-svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { calculateStreak } from '$lib/features/habits/streak';

	const longestStreak = $derived(
		habitsState.habits.reduce((max, h) => {
			const streak = calculateStreak(h, habitsState.entriesFor(h.id));
			return streak > max.streak ? { streak, name: h.name } : max;
		}, { streak: 0, name: '' })
	);
</script>

{#if longestStreak.streak >= 2}
	<div class="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 premium-shadow border border-amber-100 dark:border-amber-900/50">
		<Flame class="text-amber-500 animate-pulse" size={18} />
		<div>
			<span class="font-bold">{longestStreak.streak} Tage Streak!</span>
			<span class="opacity-80">Weiter so mit "{longestStreak.name}".</span>
		</div>
	</div>
{/if}
