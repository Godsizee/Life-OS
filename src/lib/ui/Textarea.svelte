<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		value = $bindable(''),
		element = $bindable<HTMLTextAreaElement | null>(null),
		surface = '0',
		class: className = '',
		...rest
	}: HTMLTextareaAttributes & { value?: string; element?: HTMLTextAreaElement | null; surface?: '0' | '1' } = $props();
</script>

<textarea
	bind:this={element}
	bind:value
	class="min-h-12 min-w-0 w-full rounded-xl border border-border-color {surface === '1'
		? 'bg-surface-1'
		: 'bg-surface-0'} px-4 py-3 text-base text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-200 {className}"
	{...rest}
></textarea>
