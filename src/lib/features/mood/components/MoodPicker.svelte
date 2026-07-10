<script lang="ts">
	import { MOOD_EMOJIS, MOOD_LABELS } from '../types';

	let { value = $bindable<number | null>(null), onselect }: {
		value?: number | null;
		onselect?: (score: number) => void;
	} = $props();
</script>

<div class="flex justify-between gap-1">
	{#each [1, 2, 3, 4, 5] as score}
		<button
			type="button"
			onclick={() => { value = score; onselect?.(score); }}
			aria-label={MOOD_LABELS[score]}
			class="flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-2 transition-all active:scale-95
				{value === score
					? 'border-primary-active bg-primary-active-bg'
					: 'border-border-color bg-surface-0 hover:border-primary-200 dark:hover:border-primary-900'}"
		>
			<span class="text-2xl">{MOOD_EMOJIS[score]}</span>
			<span class="text-[9px] font-medium {value === score ? 'text-primary-active' : 'text-text-secondary'}">
				{MOOD_LABELS[score]}
			</span>
		</button>
	{/each}
</div>
