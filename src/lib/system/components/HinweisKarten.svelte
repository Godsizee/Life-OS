<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { Hinweis } from '#lib/core/modul.js';
	import { toastState } from '#lib/core/toast.svelte.js';
	import { sammleHinweise, schalteArtAus, schlummere } from '../hinweise.js';

	// Schwellen wie „nach 18:00“ ändern sich ohne Datenänderung: die Uhrzeit läuft deshalb mit.
	let jetzt = $state(new Date());
	onMount(() => {
		const t = setInterval(() => (jetzt = new Date()), 60_000);
		return () => clearInterval(t);
	});

	const hinweise = $derived(sammleHinweise(jetzt));
	let laeuft = $state<string | null>(null);

	async function ausfuehren(h: Hinweis) {
		const a = h.aktion;
		if (!a) return;
		if (a.ausfuehren) {
			laeuft = h.id;
			try {
				await a.ausfuehren();
			} catch {
				toastState.error('Das hat nicht geklappt.');
			} finally {
				laeuft = null;
			}
		} else if (a.href) {
			await goto(a.href);
		}
	}

	async function spaeter(h: Hinweis) {
		const morgen = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() + 1);
		await schlummere(h.id, morgen);
		toastState.info('Bis morgen zurückgestellt.');
	}

	async function ausschalten(h: Hinweis) {
		await schalteArtAus(h.art);
		toastState.info(
			'Diese Art Hinweis ist aus. Unter Einstellungen lässt sie sich wieder einschalten.'
		);
	}
</script>

{#if hinweise.length > 0}
	<section class="space-y-3" aria-label="Hinweise">
		{#each hinweise as h (h.id)}
			<article class="glass-card premium-shadow space-y-3 rounded-2xl p-4">
				<div class="space-y-1">
					<h3 class="text-sm font-bold text-text-primary">{h.titel}</h3>
					<p class="text-xs leading-relaxed text-text-secondary">{h.text}</p>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					{#if h.aktion}
						<button
							type="button"
							onclick={() => ausfuehren(h)}
							disabled={laeuft === h.id}
							class="min-h-11 rounded-xl bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 dark:bg-primary-600"
						>
							{h.aktion.label}
						</button>
					{/if}
					<button
						type="button"
						onclick={() => spaeter(h)}
						class="min-h-11 rounded-xl border border-border-color px-4 text-sm font-medium text-text-secondary hover:bg-surface-2"
					>
						Später
					</button>
				</div>

				<details class="text-xs text-text-secondary">
					<summary class="min-h-11 cursor-pointer py-2.5 font-medium">Warum?</summary>
					<div class="space-y-2 pb-1">
						<p><span class="font-semibold text-text-primary">Was:</span> {h.warum.was}</p>
						<p>
							<span class="font-semibold text-text-primary">Warum jetzt:</span>
							{h.warum.warumJetzt}
						</p>
						{#if h.warum.daten.length > 0}
							<ul class="list-inside list-disc font-mono">
								{#each h.warum.daten as zeile}<li>{zeile}</li>{/each}
							</ul>
						{/if}
						{#if h.warum.staerke}<p class="text-text-tertiary">{h.warum.staerke}</p>{/if}
						<div class="flex flex-wrap gap-2 pt-1">
							<button
								type="button"
								onclick={() => ausschalten(h)}
								class="min-h-11 rounded-xl border border-border-color px-3 font-medium text-text-primary hover:bg-surface-2"
							>
								Diese Art Hinweis abschalten
							</button>
							{#each h.warum.steuerung.filter((s) => !s.label.startsWith('Diese Art Hinweis')) as s (s.label)}
								<a
									href={s.href}
									class="flex min-h-11 items-center rounded-xl px-3 font-medium text-primary-active hover:underline"
									>{s.label}</a
								>
							{/each}
						</div>
					</div>
				</details>
			</article>
		{/each}
	</section>
{/if}
