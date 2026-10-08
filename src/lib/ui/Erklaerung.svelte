<script lang="ts">
	import type { Erklaerung } from '#lib/core/modul.js';

	let { erklaerung, class: className = '' }: { erklaerung: Erklaerung; class?: string } = $props();
</script>

<div class="flex flex-col gap-3 text-sm {className}">
	<section>
		<h3 class="mono-label text-text-3">Was</h3>
		<p>{erklaerung.was}</p>
	</section>
	<section>
		<h3 class="mono-label text-text-3">Warum jetzt</h3>
		<p>{erklaerung.warumJetzt}</p>
	</section>
	{#if erklaerung.daten.length > 0}
		<section>
			<h3 class="mono-label text-text-3">Daten</h3>
			<ul class="list-disc pl-5">
				{#each erklaerung.daten as zeile (zeile)}
					<li>{zeile}</li>
				{/each}
			</ul>
		</section>
	{/if}
	{#if erklaerung.staerke}
		<section>
			<h3 class="mono-label text-text-3">Stärke</h3>
			<p>{erklaerung.staerke}</p>
		</section>
	{/if}
	{#if erklaerung.steuerung.length > 0}
		<section>
			<h3 class="mono-label text-text-3">Steuerung</h3>
			<ul class="flex flex-col gap-1">
				{#each erklaerung.steuerung as s (s.href + s.label)}
					<li><a href={s.href} class="underline decoration-2 underline-offset-4">{s.label}</a></li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
