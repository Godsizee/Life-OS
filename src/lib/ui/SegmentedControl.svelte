<script lang="ts" generics="T extends string">
	import { haptic } from '#lib/core/haptics.js';

	let {
		value = $bindable(),
		options,
		label,
		onchange
	}: {
		value: T;
		options: { value: T; label: string }[];
		/** Beschreibt die Gruppe für Screenreader, z. B. "Ansicht wählen". */
		label: string;
		onchange?: (value: T) => void;
	} = $props();

	let gruppe = $state<HTMLElement | null>(null);

	function select(next: T) {
		if (next === value) return;
		value = next;
		haptic(10);
		onchange?.(next);
	}

	// Radiogruppe: Pfeiltasten wählen und setzen den Fokus mit, Tab verlässt die Gruppe.
	function onkeydown(event: KeyboardEvent) {
		const delta =
			event.key === 'ArrowRight' || event.key === 'ArrowDown'
				? 1
				: event.key === 'ArrowLeft' || event.key === 'ArrowUp'
					? -1
					: 0;
		if (!delta) return;
		event.preventDefault();
		const index = options.findIndex((o) => o.value === value);
		const nextIndex = (index + delta + options.length) % options.length;
		select(options[nextIndex].value);
		gruppe?.querySelectorAll<HTMLElement>('[role="radio"]')[nextIndex]?.focus();
	}
</script>

<div
	bind:this={gruppe}
	role="radiogroup"
	aria-label={label}
	tabindex="-1"
	{onkeydown}
	class="select-none-native flex w-full min-w-0 rounded-md border-[length:var(--rahmen-s)] border-tinte bg-flaeche"
>
	{#each options as option (option.value)}
		{@const active = option.value === value}
		<button
			type="button"
			role="radio"
			aria-checked={active}
			tabindex={active ? 0 : -1}
			onclick={() => select(option.value)}
			class="min-h-10 min-w-0 flex-1 basis-0 truncate border-l-[length:var(--rahmen-s)] border-tinte px-2 text-sm font-semibold first:border-l-0
				{active ? 'bg-tinte text-seite' : 'text-tinte hover:bg-flaeche-2'}"
		>
			{option.label}
		</button>
	{/each}
</div>
