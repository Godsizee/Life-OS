<script lang="ts">
	let {
		taste,
		zeigen = true
	}: {
		/** Die Taste, z. B. „N“ oder „/“. Das Kürzel steht zusätzlich in der Hilfe. */
		taste: string;
		/** Hier hängt später die Erklärtiefe „knapp“ dran; bis dahin an. */
		zeigen?: boolean;
	} = $props();
</script>

{#if zeigen}
	<kbd
		aria-hidden="true"
		class="mono-label hidden rounded-sm border-[length:var(--rahmen-s)] border-tinte bg-flaeche px-1.5 py-0.5 md:inline-block"
	>
		{taste}
	</kbd>
{/if}
