<script lang="ts">
	import { Check } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import { DURATION, motionDuration } from './motion';
	import { haptic } from '$lib/core/haptics';

	let {
		checked = false,
		ontoggle
	}: {
		checked?: boolean;
		ontoggle?: () => void;
	} = $props();

	function handleClick() {
		haptic(10);
		ontoggle?.();
	}
</script>

<button
	type="button"
	onclick={handleClick}
	aria-label={checked ? 'Als offen markieren' : 'Als erledigt markieren'}
	aria-pressed={checked}
	class="flex h-12 w-12 shrink-0 items-center justify-center transition-transform active:scale-95"
>
	<span
		class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-200 {checked
			? 'border-primary-600 bg-primary-600'
			: 'border-border-color bg-surface-1'}"
	>
		{#if checked}
			<span in:scale={{ duration: motionDuration(DURATION.fast), start: 0.5 }}>
				<Check size={14} class="text-white" strokeWidth={3} />
			</span>
		{/if}
	</span>
</button>
