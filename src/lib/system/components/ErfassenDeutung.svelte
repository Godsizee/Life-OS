<script lang="ts">
	import InfoTip from '#lib/ui/InfoTip.svelte';
	import { beispiele } from '../erfassen.js';
	import type { ErfassenSitzung } from '../erfassen-sitzung.svelte.js';

	let { sitzung }: { sitzung: ErfassenSitzung } = $props();

	// Vorläufige Farben je Art, bis die Modulfarben aus den Design-Tokens (P3) kommen.
	const FARBE: Record<string, string> = {
		aufgabe: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
		einkauf: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
		termin: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
		gesundheit: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400',
		routine: 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400',
		stimmung: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
		notiz: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
		ziel: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400'
	};
	const farbe = (id: string) => FARBE[id] ?? 'bg-surface-2 text-text-secondary';

	const text = $derived(sitzung.text.trim());
</script>

<div class="space-y-3" aria-live="polite">
	{#if text && sitzung.aktuell}
		{@const a = sitzung.aktuell}
		<div class="space-y-2">
			<span
				class="inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase {farbe(a.art.id)}"
			>
				{a.vorschau.art}
			</span>
			<dl class="space-y-0.5 font-mono text-xs">
				{#each a.vorschau.felder as feld (feld.label)}
					<div class="flex gap-3">
						<dt class="w-20 shrink-0 text-text-tertiary uppercase">{feld.label}</dt>
						<dd class="min-w-0 break-words text-text-primary">{feld.wert}</dd>
					</div>
				{/each}
			</dl>
			{#if sitzung.unsicher}
				<p class="flex items-center gap-2 text-sm text-text-secondary">
					<span>Ich bin unsicher — als was soll ich es anlegen?</span>
					<InfoTip
						kurz="Ohne deine Wahl legt Life OS es als Aufgabe ohne Termin an. Sie liegt dann im Eingang, bis du sie einordnest."
						hilfeId="system.eingang"
						label="Mehr zum Eingang"
					/>
				</p>
			{/if}
		</div>

		{#if sitzung.andere.length > 0}
			<div class="space-y-1.5">
				<p class="text-xs text-text-tertiary">Stattdessen als:</p>
				<div class="flex flex-wrap gap-2">
					{#each sitzung.andere as d (d.art.id)}
						<button
							type="button"
							onclick={() => sitzung.waehle(d.art.id)}
							class="min-h-11 rounded-xl border border-border-color px-3 text-sm font-medium text-text-primary hover:bg-surface-2"
						>
							{d.art.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{:else if text}
		<p class="text-sm text-text-secondary">Dafür ist gerade kein passendes Modul eingeschaltet.</p>
	{/if}

	<details class="text-sm">
		<summary class="min-h-11 cursor-pointer py-2 text-text-secondary"
			>So kannst du schreiben</summary
		>
		<ul class="space-y-1.5 pb-2">
			{#each beispiele() as b (b.id)}
				<li>
					<span class="font-medium text-text-primary">{b.label}:</span>
					<span class="font-mono text-xs text-text-secondary">{b.beispiele.join(' · ')}</span>
				</li>
			{/each}
		</ul>
	</details>
</div>
