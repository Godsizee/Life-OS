<script lang="ts">
	import type { HilfeThema } from '#lib/core/modul.js';
	import { renderMarkdownSafe } from '#lib/features/notes/markdown.js';

	let { abschnitte }: { abschnitte: HilfeThema['abschnitte'] } = $props();
</script>

<div class="flex flex-col gap-5">
	{#each abschnitte as a, i (i)}
		<section class="flex flex-col gap-2">
			{#if a.titel}
				<h2 class="mono-label">{a.titel}</h2>
			{/if}
			<div class="flex flex-col gap-2 leading-relaxed [&_strong]:font-extrabold">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- html stammt aus renderMarkdownSafe -->
				{@html renderMarkdownSafe(a.text)}
			</div>
		</section>
	{/each}
</div>
