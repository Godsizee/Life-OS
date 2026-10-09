<script lang="ts">
	import { alleThemen } from '#lib/system/hilfe.js';
	import { glossar } from '#lib/system/hilfe-kern.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';

	const eintraege = $derived(glossar(alleThemen()));
</script>

<svelte:head><title>Begriffe - Hilfe - Life OS</title></svelte:head>

<p class="mb-4">
	<a href="/hilfe" class="mono-label underline decoration-2 underline-offset-4">Alle Themen</a>
</p>

<PageHeader title="Begriffe" subtitle="Alphabetisch" />

<dl class="box m-0 p-0">
	{#each eintraege as e (e.wort)}
		<div class="border-b-[length:var(--rahmen-s)] border-tinte px-3 py-3 last:border-b-0">
			<dt class="font-semibold">{e.wort}</dt>
			<dd class="m-0 text-text-2">
				{e.erklaerung}
				<a
					href="/hilfe/{e.thema}"
					class="mono-label ml-1 underline decoration-2 underline-offset-4"
				>
					Mehr
				</a>
			</dd>
		</div>
	{/each}
</dl>
