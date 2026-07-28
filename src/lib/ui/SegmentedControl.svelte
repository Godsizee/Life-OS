<script lang="ts" generics="T extends string">
	import { haptic } from '$lib/core/haptics';

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

	function select(next: T) {
		if (next === value) return;
		value = next;
		haptic(10);
		onchange?.(next);
	}
</script>

<div
	role="tablist"
	aria-label={label}
	class="flex w-full min-w-0 gap-1 rounded-xl bg-surface-2 p-1 select-none-native"
>
	{#each options as option (option.value)}
		{@const active = option.value === value}
		<button
			type="button"
			role="tab"
			aria-selected={active}
			onclick={() => select(option.value)}
			class="min-h-10 min-w-0 flex-1 basis-0 truncate rounded-lg px-2 text-sm font-medium transition-all active:scale-95
				{active
				? 'bg-surface-0 text-text-primary elevation-1'
				: 'text-text-secondary hover:text-text-primary'}"
		>
			{option.label}
		</button>
	{/each}
</div>
