<script lang="ts">
	import { wert } from '#lib/core/einstellungen.js';
	import { automationAlle, leseUeberschreibung } from '#lib/features/automationen/einstellungen.js';
	import { REGELN } from '#lib/features/automationen/regeln.js';
	import { ZUSAMMENSPIEL } from '#lib/features/hilfe/inhalte/zusammenspiel.js';
	import { aktiveModule } from '#lib/system/module-aktiv.svelte.js';
	import { regelStatus, zusammenspielFuer } from '#lib/system/zusammenspiel-kern.js';
	import { modules } from '#lib/config/modules.js';
	import Box from '#lib/ui/Box.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';

	const aktiveIds = $derived(aktiveModule.meta.map((m) => m.id));
	const labelVon = (id: string) => modules.find((m) => m.id === id)?.label ?? id;
	const regelnVon = (id: string) => REGELN.filter((r) => r.module.includes(id as never));
	const aktiv = (id: string, standard: boolean) =>
		regelStatus(wert(automationAlle), leseUeberschreibung(id).aktiv, standard) === 'aktiv';
</script>

<svelte:head><title>So hängt Life OS zusammen - Life OS</title></svelte:head>

<p class="mb-4">
	<a href="/hilfe" class="mono-label underline decoration-2 underline-offset-4">Alle Themen</a>
</p>

<PageHeader title="So hängt Life OS zusammen" subtitle="Wer wen beliefert" />

<p class="mb-6 text-text-2">
	Jedes Modul steht für sich. Hier siehst du, welche Module einander Daten liefern und welche Regeln
	sie verbinden. Ausgeschaltete Module fehlen.
</p>

<div class="flex flex-col gap-6">
	{#each aktiveModule.meta as m (m.id)}
		{@const z = zusammenspielFuer(m.id, aktiveIds, ZUSAMMENSPIEL)}
		{@const regeln = regelnVon(m.id)}
		<Box titel={m.label} modul={m.id}>
			<div class="flex flex-col gap-4 p-3">
				{#if z.bekommtVon.length === 0 && z.liefertAn.length === 0 && regeln.length === 0}
					<p class="text-text-2">Dieses Modul steht für sich.</p>
				{/if}
				{#if z.bekommtVon.length > 0}
					<section>
						<h2 class="mono-label mb-1">Bekommt von ←</h2>
						<ul class="m-0 list-none p-0">
							{#each z.bekommtVon as e (e.mit + e.wie)}
								<li><span class="font-semibold">{labelVon(e.mit)}:</span> {e.wie}</li>
							{/each}
						</ul>
					</section>
				{/if}
				{#if z.liefertAn.length > 0}
					<section>
						<h2 class="mono-label mb-1">Liefert an →</h2>
						<ul class="m-0 list-none p-0">
							{#each z.liefertAn as e (e.mit + e.wie)}
								<li><span class="font-semibold">{labelVon(e.mit)}:</span> {e.wie}</li>
							{/each}
						</ul>
					</section>
				{/if}
				{#if regeln.length > 0}
					<section>
						<h2 class="mono-label mb-1">Regeln</h2>
						<ul class="m-0 flex list-none flex-col gap-2 p-0">
							{#each regeln as r (r.id)}
								<li class="flex flex-wrap items-center justify-between gap-2">
									<span class="min-w-0 flex-1">{r.titel}</span>
									<span class="flex items-center gap-3">
										<span
											class="mono-label rounded-sm border-[length:var(--rahmen-s)] border-tinte px-2 py-0.5 {aktiv(
												r.id,
												r.standard.aktiv
											)
												? 'bg-signal text-auf-farbe'
												: 'bg-flaeche-2 text-text-3'}"
										>
											{aktiv(r.id, r.standard.aktiv) ? 'Aktiv' : 'Aus'}
										</span>
										<a
											href="/settings/automationen#{r.id}"
											class="mono-label underline decoration-2 underline-offset-4"
										>
											Regel ansehen
										</a>
									</span>
								</li>
							{/each}
						</ul>
					</section>
				{/if}
			</div>
		</Box>
	{/each}
</div>
