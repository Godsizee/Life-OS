<script lang="ts">
	import { haptic } from '#lib/core/haptics.js';

	let {
		checked = $bindable(false),
		label,
		description,
		labelVersteckt = false,
		disabled = false,
		onchange
	}: {
		checked?: boolean;
		label: string;
		/** Optionaler Beisatz unter dem Label – erklärt die Folge des Schaltens. */
		description?: string;
		/** Nur für Hilfstechnik: Das sichtbare Label steht schon daneben (z. B. in `SettingRow`). */
		labelVersteckt?: boolean;
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
	class="flex min-h-[var(--ziel-min)] items-center justify-between gap-4 text-left disabled:opacity-50 {labelVersteckt
		? ''
		: 'w-full'}"
>
	<span class="flex min-w-0 flex-col {labelVersteckt ? 'sr-only' : ''}">
		<span class="truncate text-sm font-semibold text-tinte">{label}</span>
		{#if description}
			<span class="truncate text-xs text-text-2">{description}</span>
		{/if}
	</span>

	<!-- Zustand steht als Text neben dem Schalter, nie nur in der Farbe. -->
	<span class="flex shrink-0 items-center gap-2">
		<span class="mono-label w-8 text-right text-text-2">{checked ? 'An' : 'Aus'}</span>
		<span
			class="relative inline-flex h-7 w-12 items-center rounded-sm border-[length:var(--rahmen-s)] border-tinte {checked
				? 'bg-signal'
				: 'bg-flaeche-2'}"
		>
			<span
				class="inline-block h-4 w-4 border-[length:var(--rahmen-s)] border-tinte bg-tinte transition-transform duration-[var(--dauer-schnell)] {checked
					? 'translate-x-6'
					: 'translate-x-1'}"
			></span>
		</span>
	</span>
</button>
