<script lang="ts">
	import { updated } from '$app/state';
	import Button from '#lib/ui/Button.svelte';

	// Sichtbar, sobald SvelteKit eine neue Version erkennt (version.pollInterval in vite.config.ts).
	const sichtbar = $derived(updated.current);
	let laedt = $state(false);

	async function jetztLaden() {
		laedt = true;
		const reg = await navigator.serviceWorker?.getRegistration();
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
