<script lang="ts">
	import { TrendingDown, TrendingUp, Minus } from 'lucide-svelte';
	import { vergleiche, type Kennzahl } from '../week-compare';

	let { kennzahl, children }: { kennzahl: Kennzahl; children?: import('svelte').Snippet } = $props();
	const v = $derived(vergleiche(kennzahl));
</script>

<div class="rounded-xl border border-border-color bg-surface-0 p-4">
	<p class="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{kennzahl.label}</p>
	<!--
		Werte wie "12.500 kg" plus ein Vergleichslabel wie "+2.500 kg zur Vorwoche"
		sprengen die ~106px Innenbreite, die eine zweispaltige Kachel bei 320px hat.
		flex-wrap laesst das Label deshalb in die naechste Zeile rutschen, statt die
		Karte waagerecht ueberlaufen zu lassen.
	-->
	<div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
		<span class="min-w-0 wrap-break-word text-2xl font-bold text-text-primary tabular-nums">
			{(kennzahl.format ?? String)(kennzahl.wert)}
		</span>
		{#if v}
			<span
				class="inline-flex min-w-0 items-center gap-0.5 text-xs font-medium
				{v.richtung === 'flat' ? 'text-text-tertiary' : v.gut ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}"
			>
				{#if v.richtung === 'up'}<TrendingUp size={13} />
				{:else if v.richtung === 'down'}<TrendingDown size={13} />
				{:else}<Minus size={13} />{/if}
				{v.label}
			</span>
		{/if}
	</div>
	{#if children}<div class="mt-2">{@render children()}</div>{/if}
</div>
