<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		value = $bindable(''),
		element = $bindable<HTMLTextAreaElement | null>(null),
		surface = '0',
		invalid = false,
		class: className = '',
		...rest
	}: HTMLTextareaAttributes & {
		value?: string;
		element?: HTMLTextAreaElement | null;
		/** '1' = Seitenfarbe als Grund, '0' = Fläche (Standard). */
		surface?: '0' | '1';
		invalid?: boolean;
	} = $props();
</script>

<textarea
	bind:this={element}
	bind:value
	aria-invalid={invalid || undefined}
	class="min-h-[var(--ziel-min)] w-full min-w-0 rounded-md border-[length:var(--rahmen-s)] {invalid
		? 'border-gefahr'
		: 'border-tinte'} {surface === '1'
		? 'bg-seite'
		: 'bg-flaeche'} px-4 py-3 text-base text-tinte placeholder:text-text-3 disabled:cursor-not-allowed disabled:opacity-60 {className}"
	{...rest}></textarea>
