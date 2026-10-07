<script lang="ts">
	import { setze, wert } from '#lib/core/einstellungen.js';
	import Switch from '#lib/ui/Switch.svelte';
	import { automationAlle } from '../einstellungen.js';
	import { automationen } from '../laufzeit.svelte.js';
	import { REGELN } from '../regeln.js';
	import RegelKarte from './RegelKarte.svelte';
	import Vorschlaege from './Vorschlaege.svelte';

	let { routinen }: { routinen: { id: string; name: string }[] } = $props();

	const alleAn = $derived(wert(automationAlle));
</script>

<div class="flex flex-col gap-4 pb-8">
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<Switch
			label="Verknüpfungen verwenden"
			description={alleAn ? 'Die Regeln unten sind aktiv.' : 'Alle Regeln ruhen.'}
			checked={alleAn}
			onchange={(an) => setze(automationAlle, an)}
		/>
	</section>

	<Vorschlaege />

	{#each REGELN as regel (regel.id)}
		<RegelKarte {regel} {routinen} />
	{/each}

	<a
		href="/settings/automationen/verlauf"
		class="flex min-h-12 items-center justify-between rounded-xl border border-border-color bg-surface-0 px-4 text-sm font-medium text-text-primary shadow-sm"
	>
		<span>Verlauf ansehen</span>
		{#if automationen.fehlerAnzahl > 0}
			<span class="text-xs text-red-700 dark:text-red-300">
				{automationen.fehlerAnzahl} Fehler
			</span>
		{/if}
	</a>
</div>
