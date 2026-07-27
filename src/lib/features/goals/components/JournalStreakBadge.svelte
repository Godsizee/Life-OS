<script lang="ts">
	import { Flame } from 'lucide-svelte';
	import type { StreakInfo } from '../journal-stats';

	let { streak }: { streak: StreakInfo } = $props();
</script>

{#if streak.total > 0}
	<div
		class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold border
			{streak.isActive
			? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/40'
			: 'bg-surface-2 text-text-secondary border-border-color/30'}"
		title="Längste Streak: {streak.longest} Tage"
	>
		<Flame size={12} class={streak.isActive ? 'text-orange-500' : 'text-text-tertiary'} />
		{#if streak.current > 0}
			{streak.current} {streak.current === 1 ? 'Tag' : 'Tage'}
		{:else}
			Pausiert
		{/if}
	</div>
{/if}
