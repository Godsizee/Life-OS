<script lang="ts">
	import { haptic } from '$lib/core/haptics';

	let {
		checked = $bindable(false),
		label,
		description,
		disabled = false,
		onchange
	}: {
		checked?: boolean;
		label: string;
		/** Optionaler Beisatz unter dem Label – erklärt die Folge des Schaltens. */
		description?: string;
		disabled?: boolean;
		onchange?: (checked: boolean) => void;
	} = $props();

	function toggle() {
		if (disabled) return;
		checked = !checked;
		haptic(10);
		onchange?.(checked);
	}
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	{disabled}
	onclick={toggle}
	class="flex min-h-12 w-full items-center justify-between gap-4 text-left disabled:opacity-50"
>
	<span class="flex min-w-0 flex-col">
		<span class="truncate text-sm font-medium text-text-primary">{label}</span>
		{#if description}
			<span class="truncate text-xs text-text-tertiary">{description}</span>
		{/if}
	</span>

	<span
		class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200
			{checked ? 'bg-primary-600 dark:bg-primary-500' : 'bg-surface-3'}"
	>
		<span
			class="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200
				{checked ? 'translate-x-6' : 'translate-x-1'}"
		></span>
	</span>
</button>
