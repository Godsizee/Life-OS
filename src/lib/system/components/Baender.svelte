<script lang="ts">
	import { updated } from '$app/state';
	import { outbox } from '#lib/core/outbox.svelte.js';
	import Band from '#lib/ui/Band.svelte';
	import { waehleBand, type BandAktion } from '../baender-kern.js';

	let {
		online,
		onProbleme,
		modus = null,
		onModusBeenden
	}: {
		online: boolean;
		/** Öffnet die Liste der unzustellbaren Änderungen. */
		onProbleme: () => void;
		/** Text eines aktiven Modus (z. B. „Leiser Tag“). Die Einstellungen dafür kommen mit P6. */
		modus?: string | null;
		onModusBeenden?: () => void;
	} = $props();

	let laedt = $state(false);

	// Genau ein Band: das wichtigste. Rangfolge steht in `waehleBand`.
	const band = $derived(
		waehleBand({
			updateVerfuegbar: updated.current,
			online,
			syncStatus: outbox.status,
			wartend: outbox.pending,
			unzustellbar: outbox.dead,
			modus
		})
	);

	/** Wartet, bis ein installierender SW fertig ist (oder aufgibt). */
	function installiert(sw: ServiceWorker): Promise<void> {
		if (sw.state !== 'installing') return Promise.resolve();
		return new Promise((fertig) => {
			sw.addEventListener('statechange', () => sw.state !== 'installing' && fertig());
		});
	}

	async function jetztLaden() {
		laedt = true;
		const reg = await navigator.serviceWorker?.getRegistration();
		// Der Browser prüft den SW erst bei der nächsten Navigation. Ohne update() bliebe
		// nach dem Reload der alte SW aktiv — mit einer Offline-Hülle der neuen Version,
		// deren Dateien er nicht im Cache hat.
		await reg?.update().catch(() => {});
		if (reg?.installing) await installiert(reg.installing);
		if (reg?.waiting) {
			// Der neue SW wartet bewusst (kein skipWaiting beim Install) — erst jetzt übernehmen.
			navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), {
				once: true
			});
			reg.waiting.postMessage({ type: 'SKIP_WAITING' });
		} else {
			location.reload();
		}
	}

	function fuehreAus(art: BandAktion) {
		if (art === 'laden') void jetztLaden();
		else if (art === 'erneut') void outbox.replay();
		else if (art === 'ansehen') onProbleme();
		else onModusBeenden?.();
	}
</script>

{#if band}
	<div style="view-transition-name: baender">
		<Band variante={band.variante}>
			{band.text}
			{#snippet aktion()}
				{#if band.aktion}
					{@const a = band.aktion}
					<button
						type="button"
						disabled={laedt && a.art === 'laden'}
						onclick={() => fuehreAus(a.art)}
						class="mono-label min-h-[var(--ziel-min)] px-1 underline decoration-2 underline-offset-4 disabled:opacity-60"
					>
						{laedt && a.art === 'laden' ? 'Lädt …' : a.label}
					</button>
				{/if}
			{/snippet}
		</Band>
	</div>
{/if}
