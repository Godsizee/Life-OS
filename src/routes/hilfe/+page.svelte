<script lang="ts">
	import { modules } from '#lib/config/modules.js';
	import { alleThemen } from '#lib/system/hilfe.js';
	import { gruppiereThemen, sucheThemen } from '#lib/system/hilfe-kern.js';
	import Anleitung from '#lib/ui/Anleitung.svelte';
	import Input from '#lib/ui/Input.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';

	let suche = $state('');

	const treffer = $derived(sucheThemen(alleThemen(), suche));
	const gruppen = $derived(gruppiereThemen(treffer));
	const gruppenName = (gruppe: string) =>
		gruppe === 'system' ? 'System' : (modules.find((m) => m.id === gruppe)?.label ?? gruppe);
</script>

<svelte:head><title>Hilfe - Life OS</title></svelte:head>

<PageHeader title="Hilfe" subtitle="Kurz erklärt, ohne Tour" />

<div class="flex flex-col gap-6">
	<Input
		type="search"
		bind:value={suche}
		placeholder="Thema suchen"
		aria-label="Hilfethemen durchsuchen"
	/>

	<p>
		<a href="/hilfe/begriffe" class="mono-label underline decoration-2 underline-offset-4">
			Alle Begriffe
		</a>
	</p>

	{#if gruppen.length === 0}
		<Anleitung
			titel="Dazu gibt es kein Thema"
			was="Versuche ein anderes Wort, oder sieh dir alle Begriffe an."
		/>
	{/if}

	{#each gruppen as gruppe (gruppe.gruppe)}
		<section aria-labelledby="hg-{gruppe.gruppe}" class="box">
			<h2
				id="hg-{gruppe.gruppe}"
				class="mono-label border-b-[length:var(--rahmen)] border-tinte bg-flaeche-2 px-3 py-2"
			>
				{gruppenName(gruppe.gruppe)}
			</h2>
			<ul class="m-0 list-none p-0">
				{#each gruppe.themen as t (t.id)}
					<li class="border-b-[length:var(--rahmen-s)] border-tinte last:border-b-0">
						<a
							href="/hilfe/{t.id}"
							class="flex min-h-14 flex-col justify-center px-3 py-2 hover:bg-flaeche-2"
						>
							<span class="font-semibold">{t.titel}</span>
							<span class="text-sm text-text-2">{t.kurz}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
