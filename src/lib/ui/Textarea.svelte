<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		value = $bindable(''),
		class: className = '',
		...rest
	}: HTMLTextareaAttributes & { value?: string } = $props();
</script>

<textarea
	bind:value
	class="min-h-12 min-w-0 w-full rounded-xl border border-border-color bg-surface-0 px-4 py-3 text-base text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none transition-colors duration-200 {className}"
	{...rest}
></textarea>
