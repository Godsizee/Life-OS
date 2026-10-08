<script lang="ts">
	let {
		schritte,
		aktuell
	}: {
		/** Namen der Schritte in Reihenfolge; sie stehen für Screenreader und unter dem aktuellen Schritt. */
		schritte: string[];
		/** Nullbasiert: 0 = erster Schritt. */
		aktuell: number;
	} = $props();
</script>

<ol class="flex items-center gap-2" aria-label="Schritte">
	{#each schritte as name, i (name)}
		{@const erledigt = i < aktuell}
		{@const jetzt = i === aktuell}
		{#if i > 0}<li aria-hidden="true" class="h-[var(--rahmen-s)] w-6 bg-tinte"></li>{/if}
		<li
			aria-current={jetzt ? 'step' : undefined}
			class="mono-label nums-tabular flex h-9 min-w-9 items-center justify-center gap-2 rounded-sm border-[length:var(--rahmen-s)] border-tinte px-2 {jetzt
				? 'bg-signal text-auf-farbe'
				: erledigt
					? 'bg-tinte text-seite'
					: 'bg-flaeche text-tinte'}"
		>
			<span>{i + 1}</span>
			<span class={jetzt ? '' : 'sr-only'}>{name}</span>
		</li>
	{/each}
</ol>
