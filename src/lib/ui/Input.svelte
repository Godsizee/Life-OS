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
		/** Rahmen in Gefahr-Farbe + aria-invalid. Den Fehlertext rendert <Field error="…">. */
		invalid?: boolean;
	} = $props();
</script>

<input
	bind:this={element}
	bind:value
	aria-invalid={invalid || undefined}
	class="min-h-[var(--ziel-min)] w-full min-w-0 rounded-md border-[length:var(--rahmen-s)] bg-flaeche px-4 text-base text-tinte placeholder:text-text-3 disabled:cursor-not-allowed disabled:opacity-60
		{invalid ? 'border-gefahr' : 'border-tinte'} {className}"
	{...rest}
/>
