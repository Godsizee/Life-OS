<script lang="ts">
	import { updated } from '$app/state';
	import Button from '#lib/ui/Button.svelte';

	// Sichtbar, sobald SvelteKit eine neue Version erkennt (version.pollInterval in vite.config.ts).
	const sichtbar = $derived(updated.current);
	let laedt = $state(false);

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
</script>

{#if sichtbar}
	<div
		role="status"
		class="flex w-full items-center justify-between gap-3 border-b border-border-color bg-surface-2 px-4 py-2 text-sm"
	>
		<span>Neue Version von Life OS — jetzt laden</span>
		<Button size="sm" loading={laedt} onclick={jetztLaden}>Laden</Button>
	</div>
{/if}
