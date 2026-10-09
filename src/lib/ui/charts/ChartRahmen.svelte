<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ChartTabelle } from './farbe.js';

	let {
		beschreibung,
		tabelle,
		children
	}: {
		/** Kurzer Satz, was das Diagramm zeigt. Auch die Überschrift der Datentabelle. */
		beschreibung: string;
		/** Mit Daten erscheint der Schalter „Als Tabelle“. */
		tabelle?: ChartTabelle;
		children: Snippet;
	} = $props();

	let alsTabelle = $state(false);
</script>

<figure class="m-0 min-w-0">
	{#if alsTabelle && tabelle}
		<div class="max-h-64 overflow-auto border-[length:var(--rahmen-s)] border-tinte bg-flaeche">
			<table class="w-full border-collapse text-left text-sm">
				<caption class="sr-only">{beschreibung}</caption>
				<thead class="sticky top-0 bg-flaeche-2">
					<tr>
						{#each tabelle.kopf as spalte (spalte)}
							<th
								scope="col"
								class="mono-label border-b-[length:var(--rahmen-s)] border-tinte px-2 py-1"
								>{spalte}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each tabelle.zeilen as zeile, i (i)}
						<tr class="border-b border-tinte/30 last:border-b-0">
							{#each zeile as zelle, j (j)}
								{#if j === 0}
									<th scope="row" class="px-2 py-1 font-medium">{zelle}</th>
								{:else}
									<td class="px-2 py-1 tabular-nums">{zelle}</td>
								{/if}
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		{@render children()}
	{/if}

	{#if tabelle && tabelle.zeilen.length > 0}
		<button
			type="button"
			aria-pressed={alsTabelle}
			onclick={() => (alsTabelle = !alsTabelle)}
			class="mono-label inline-flex min-h-[var(--ziel-min)] items-center underline decoration-2 underline-offset-4"
		>
			{alsTabelle ? 'Als Diagramm' : 'Als Tabelle'}
		</button>
	{/if}
</figure>
