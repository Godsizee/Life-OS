<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	let {
		value = $bindable(''),
		class: className = '',
		children,
		...rest
	}: HTMLSelectAttributes & { value?: string; children?: Snippet } = $props();
</script>

<select
	bind:value
	class="min-h-12 min-w-0 w-full rounded-xl border border-border-color bg-surface-0 px-4 text-base text-text-primary focus:border-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-200 {className}"
	{...rest}
>
	{@render children?.()}
</select>
