<script lang="ts">
	import { abschlussAb, planenBis, rituale } from '#lib/config/heute.js';
	import { nachUhrzeit } from '#lib/core/date.js';
	import { wert } from '#lib/core/einstellungen.js';
	import { ritualeState } from '#lib/features/dashboard/rituale.svelte.js';
	import { tasksState } from '#lib/features/tasks/store.svelte.js';
	import { imEingang } from '#lib/features/tasks/utils.js';
	import Button from '#lib/ui/Button.svelte';

	let { jetzt }: { jetzt: Date } = $props();

	const eingang = $derived(tasksState.tasks.filter(imEingang).length);
	const heute = $derived(ritualeState.heute);
	const abgeschlossen = $derived(!!heute?.closed_at);
	// Abschluss ab `heute.abschlussAb`; Planen bis `heute.planenBis` und nur, solange noch nicht geplant.
	const zeigeAbschluss = $derived(!abgeschlossen && nachUhrzeit(jetzt, wert(abschlussAb)));
	const zeigePlanen = $derived(
		!abgeschlossen && !zeigeAbschluss && !heute?.planned_at && !nachUhrzeit(jetzt, wert(planenBis))
	);
</script>

{#if wert(rituale)}
	<div
		class="flex flex-wrap items-center justify-between gap-3 border-y-[length:var(--rahmen-s)] border-tinte py-2"
	>
		{#if abgeschlossen}
			<p class="mono-label">Tag abgeschlossen</p>
			<a href="/tasks" class="mono-label underline decoration-2 underline-offset-4"
				>Morgen ansehen</a
			>
		{:else if zeigeAbschluss}
			<a href="/heute/abschluss" class="contents"><Button>Tag abschließen</Button></a>
		{:else if zeigePlanen}
			<a href="/heute/planen" class="contents"><Button>Tag planen · 2 min</Button></a>
		{:else}
			<p class="mono-label text-text-3">Tag {heute?.planned_at ? 'geplant' : 'offen'}</p>
		{/if}
		{#if eingang > 0}
			<a href="/tasks" class="mono-label underline decoration-2 underline-offset-4">
				Eingang: {eingang}
			</a>
		{/if}
	</div>
{/if}
