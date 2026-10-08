<script lang="ts">
	import type { ModulId } from '#lib/config/modules.js';

	let {
		wert,
		max = 100,
		label,
		modul,
		text
	}: {
		wert: number;
		max?: number;
		/** Zugänglicher Name, z. B. „Wasser heute“. */
		label: string;
		/** Füllfarbe; ohne Angabe die Signalfarbe. */
		modul?: ModulId;
		/** Beschriftung neben dem Balken; Standard `wert / max`. */
		text?: string;
	} = $props();

	const anteil = $derived(max > 0 ? Math.min(100, Math.max(0, (wert / max) * 100)) : 0);
</script>

<div class="flex items-center gap-3">
	<div
		class="h-4 flex-1 overflow-hidden rounded-sm border-[length:var(--rahmen-s)] border-tinte bg-flaeche"
		role="progressbar"
		aria-label={label}
		aria-valuemin="0"
		aria-valuemax={max}
		aria-valuenow={wert}
	>
		<div
			class="h-full border-r-[length:var(--rahmen-s)] border-tinte"
			style:width="{anteil}%"
			style:background-color={modul ? `var(--mod-${modul})` : 'var(--signal)'}
		></div>
	</div>
	<span class="mono-label nums-tabular shrink-0 text-text-2">{text ?? `${wert} / ${max}`}</span>
</div>
