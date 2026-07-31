<script lang="ts">
	import Input from './Input.svelte';

	let { value, limits, suffix, onchange }: {
		value: number;
		limits: { min: number; max: number; step: number };
		suffix?: string;
		onchange: (next: number) => void;
	} = $props();
</script>

<div class="flex items-center gap-2">
	<Input
		type="number"
		min={String(limits.min)}
		max={String(limits.max)}
		step={String(limits.step)}
		value={String(value)}
		onchange={(e) => onchange(Number((e.currentTarget as HTMLInputElement).value))}
		class="w-24 text-center"
	/>
	{#if suffix}<span class="text-xs text-text-tertiary">{suffix}</span>{/if}
</div>
