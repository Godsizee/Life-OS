<script lang="ts">
	import { Check } from '@lucide/svelte';
	import { scale } from 'svelte/transition';
	import type { ModulId } from '#lib/config/modules.js';
	import { DURATION, motionDuration } from './motion';
	import { haptic } from '#lib/core/haptics.js';

	let {
		checked = false,
		modul,
		label,
		ontoggle
	}: {
		checked?: boolean;
		/** Füllfarbe im Zustand „gesetzt“; ohne Angabe die Signalfarbe. */
		modul?: ModulId;
		/** Zugänglicher Name, z. B. der Aufgabentitel. */
		label?: string;
		ontoggle?: () => void;
	} = $props();

	function handleClick() {
		haptic(10);
		ontoggle?.();
	}
</script>

<!-- 28-px-Box in einem 48-px-Ziel; die Leertaste löst bei <button> den Klick aus. -->
<button
	type="button"
	role="checkbox"
	aria-checked={checked}
	aria-label={label ?? (checked ? 'Als offen markieren' : 'Als erledigt markieren')}
	onclick={handleClick}
	class="flex h-[var(--ziel-min)] w-[var(--ziel-min)] shrink-0 items-center justify-center"
>
	<span
		class="flex h-7 w-7 items-center justify-center rounded-sm border-[length:var(--rahmen-s)] border-tinte {checked
			? 'text-auf-farbe'
			: 'bg-flaeche'}"
		style:background-color={checked ? (modul ? `var(--mod-${modul})` : 'var(--signal)') : undefined}
	>
		{#if checked}
			<span in:scale={{ duration: motionDuration(DURATION.fast), start: 0.5 }}>
				<Check size={18} strokeWidth={3.5} />
			</span>
		{/if}
	</span>
</button>
