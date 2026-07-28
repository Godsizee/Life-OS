<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		value = $bindable(''),
		element = $bindable(null),
		invalid = false,
		class: className = '',
		...rest
	}: HTMLInputAttributes & {
		value?: string | number | null;
		/** Zugriff aufs DOM-Element, z. B. um es zu fokussieren. */
		element?: HTMLInputElement | null;
		/** Rahmen rot + aria-invalid. Den Fehlertext rendert <Field error="…">. */
		invalid?: boolean;
	} = $props();
</script>

<input
	bind:this={element}
	bind:value
	aria-invalid={invalid || undefined}
	class="min-h-12 min-w-0 w-full rounded-xl border bg-surface-0 px-4 text-base text-text-primary placeholder:text-text-tertiary focus:outline-none transition-colors duration-200
		{invalid
		? 'border-red-500 focus:border-red-500'
		: 'border-border-color focus:border-primary-500'} {className}"
	{...rest}
/>
