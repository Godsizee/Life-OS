<script lang="ts">
	import { modules, type ModulId } from '#lib/config/modules.js';
	import { setze, wert } from '#lib/core/einstellungen.js';
	import { MODUL_THEMEN } from '#lib/features/hilfe/inhalte/module.js';
	import { ZUSAMMENSPIEL } from '#lib/features/hilfe/inhalte/zusammenspiel.js';
	import Box from '#lib/ui/Box.svelte';
	import Button from '#lib/ui/Button.svelte';
	import { hilfeGesehen, hilfeNiveau } from '../einstellungen/hilfe.js';
	import { istAktiv } from '../module-aktiv.svelte.js';

	let {
		modul,
		beispiel
	}: {
		modul: ModulId;
		/** Optional: legt Beispieldaten an („Beispiel anlegen“). */
		beispiel?: () => Promise<void>;
	} = $props();

	const schluessel = $derived(`intro:${modul}`);
	const meta = $derived(modules.find((m) => m.id === modul));
	const thema = $derived(MODUL_THEMEN.find((t) => t.id === `${modul}.einstieg`));
	const start = $derived(thema?.abschnitte[0]?.text ?? '');
	const verbunden = $derived(
		(ZUSAMMENSPIEL[modul] ?? [])
			.filter((z) => istAktiv(z.mit))
			.map((z) => ({ ...z, label: modules.find((m) => m.id === z.mit)?.label ?? z.mit }))
	);
	const sichtbar = $derived(
		!!meta && !wert(hilfeGesehen).includes(schluessel) && wert(hilfeNiveau) !== 'knapp'
	);
	let legtAn = $state(false);

	const ausblenden = () => setze(hilfeGesehen, [...wert(hilfeGesehen), schluessel]);

	async function beispielAnlegen() {
		if (!beispiel) return;
		legtAn = true;
		try {
			await beispiel();
			await ausblenden();
		} finally {
			legtAn = false;
		}
	}
</script>

{#if sichtbar && meta}
	<div class="mb-6">
		<Box {modul} titel="{meta.label} · Einführung">
			<div class="flex flex-col gap-3 p-4">
				<section class="flex flex-col gap-1">
					<h3 class="mono-label text-text-3">Was</h3>
					<p>{meta.kurz}</p>
				</section>
				{#if start}
					<section class="flex flex-col gap-1">
						<h3 class="mono-label text-text-3">So startest du</h3>
						<!-- Fett-Markierungen des Hilfetextes bleiben hier einfacher Text. -->
						<p>{start.replace(/\*\*/g, '').replace(/`/g, '')}</p>
					</section>
				{/if}
				{#if verbunden.length > 0}
					<section class="flex flex-col gap-1">
						<h3 class="mono-label text-text-3">Spielt zusammen mit</h3>
						<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
							{#each verbunden as v (v.mit)}
								<li
									class="mono-label border-[length:var(--rahmen-s)] border-tinte bg-flaeche px-2 py-1"
									title={v.wie}
								>
									{v.label}
								</li>
							{/each}
						</ul>
					</section>
				{/if}
				<div class="flex flex-wrap items-center gap-2">
					{#if beispiel}
						<Button variant="sekundaer" loading={legtAn} onclick={beispielAnlegen}>
							Beispiel anlegen
						</Button>
					{/if}
					<a href="/hilfe/{modul}.einstieg" class="contents">
						<Button variant="sekundaer">Mehr erfahren</Button>
					</a>
					<Button variant="ghost" onclick={ausblenden}>Ausblenden</Button>
				</div>
			</div>
		</Box>
	</div>
{/if}
