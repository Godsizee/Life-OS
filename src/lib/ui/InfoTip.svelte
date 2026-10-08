<script lang="ts">
	import { Info } from '@lucide/svelte';
	import { platziere } from './popover-position';

	let {
		kurz,
		hilfeId,
		label = 'Mehr dazu'
	}: {
		/** Ein bis zwei Sätze, die den Fachbegriff erklären. */
		kurz: string;
		/** Mit Angabe führt „Mehr erfahren“ zu `/hilfe/<id>`. */
		hilfeId?: string;
		/** Zugänglicher Name der Taste. */
		label?: string;
	} = $props();

	const id = $props.id();
	let pop = $state<HTMLElement | null>(null);
	let taste = $state<HTMLElement | null>(null);
	let offen = $state(false);

	function ontoggle(event: Event) {
		offen = (event as ToggleEvent).newState === 'open';
		if (offen && pop && taste) platziere(pop, taste, 'start');
	}
</script>

<!-- Sichtbar 24 px, die Trefferfläche reicht über das Pseudo-Element auf 48 px. -->
<button
	bind:this={taste}
	type="button"
	popovertarget={id}
	aria-label={label}
	aria-expanded={offen}
	class="relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[length:var(--rahmen-s)] border-tinte bg-flaeche text-tinte after:absolute after:-inset-3 after:content-['']"
>
	<Info size={14} />
</button>

<div
	bind:this={pop}
	{id}
	popover="auto"
	{ontoggle}
	class="box fixed inset-auto m-0 max-w-72 p-3 text-sm"
	style="box-shadow: var(--schatten-s)"
>
	<p>{kurz}</p>
	{#if hilfeId}
		<a
			href="/hilfe/{hilfeId}"
			class="mt-2 inline-block font-semibold underline decoration-2 underline-offset-4"
		>
			Mehr erfahren
		</a>
	{/if}
</div>
