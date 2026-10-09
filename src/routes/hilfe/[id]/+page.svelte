<script lang="ts">
	import { page } from '$app/state';
	import HilfeText from '#lib/features/hilfe/components/HilfeText.svelte';
	import { alleThemen } from '#lib/system/hilfe.js';
	import { findeThema } from '#lib/system/hilfe-kern.js';
	import Anleitung from '#lib/ui/Anleitung.svelte';

	const themen = $derived(alleThemen());
	const thema = $derived(findeThema(themen, page.params.id ?? ''));
	const verwandt = $derived(
		(thema?.verwandt ?? []).map((id) => findeThema(themen, id)).filter((t) => t !== undefined)
	);
</script>

<svelte:head><title>{thema ? `${thema.titel} - Hilfe` : 'Hilfe'} - Life OS</title></svelte:head>

<p class="mb-4">
	<a href="/hilfe" class="mono-label underline decoration-2 underline-offset-4">Alle Themen</a>
</p>

{#if thema}
	<article class="flex flex-col gap-6">
		<header class="flex flex-col gap-2">
			<h1 class="text-3xl leading-tight font-extrabold [font-stretch:85%]">{thema.titel}</h1>
			<p class="text-text-2">{thema.kurz}</p>
		</header>

		<HilfeText abschnitte={thema.abschnitte} />

		{#if thema.begriffe && thema.begriffe.length > 0}
			<section class="box">
				<h2 class="mono-label border-b-[length:var(--rahmen)] border-tinte bg-flaeche-2 px-3 py-2">
					Begriffe
				</h2>
				<dl class="m-0 p-3">
					{#each thema.begriffe as b (b.wort)}
						<dt class="font-semibold">{b.wort}</dt>
						<dd class="m-0 mb-2 text-text-2 last:mb-0">{b.erklaerung}</dd>
					{/each}
				</dl>
			</section>
		{/if}

		{#if verwandt.length > 0}
			<nav aria-labelledby="verwandt-titel" class="flex flex-col gap-2">
				<h2 id="verwandt-titel" class="mono-label">Verwandt</h2>
				<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
					{#each verwandt as v (v.id)}
						<li>
							<a
								href="/hilfe/{v.id}"
								class="mono-label inline-flex min-h-[var(--ziel-min)] items-center border-[length:var(--rahmen-s)] border-tinte bg-flaeche px-3 hover:bg-flaeche-2"
							>
								{v.titel}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		{/if}
	</article>
{:else}
	<Anleitung
		titel="Thema nicht gefunden"
		was="Dieses Hilfethema gibt es nicht (mehr). In der Übersicht findest du alle Themen und die Suche."
	/>
{/if}
