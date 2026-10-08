<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	let {
		value = $bindable(''),
		invalid = false,
		class: className = '',
		children,
		...rest
	}: HTMLSelectAttributes & { value?: string; invalid?: boolean; children?: Snippet } = $props();
</script>

<select
	bind:value
	aria-invalid={invalid || undefined}
	class="min-h-[var(--ziel-min)] w-full min-w-0 rounded-md border-[length:var(--rahmen-s)] bg-flaeche px-4 text-base text-tinte disabled:cursor-not-allowed disabled:opacity-60 {invalid
		? 'border-gefahr'
		: 'border-tinte'} {className}"
	{...rest}
>
	{@render children?.()}
</select>
