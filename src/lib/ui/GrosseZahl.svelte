<script lang="ts">
	let {
		wert,
		einheit,
		vergleich,
		class: className = ''
	}: {
		wert: string | number;
		/** Steht in Mono neben der Zahl, z. B. „Punkte“ oder „Gläser“. */
		einheit?: string;
		/** Zeile darunter, z. B. „+4 ggü. letzter Woche“. Immer Text, kein Bild. */
		vergleich?: string;
		class?: string;
	} = $props();
</script>

<div class={className}>
	<div class="flex items-baseline gap-2">
		<span class="nums-tabular text-display leading-none font-extrabold [font-stretch:85%]">
			{wert}
		</span>
		{#if einheit}<span class="mono-label text-text-2">{einheit}</span>{/if}
	</div>
	{#if vergleich}<p class="mono-label mt-1 text-text-2">{vergleich}</p>{/if}
</div>
