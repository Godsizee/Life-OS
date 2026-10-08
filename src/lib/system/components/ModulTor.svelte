<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { modulFuerPfad } from '#lib/config/nav.js';
	import { authState } from '#lib/core/auth.svelte.js';
	import { profileState } from '#lib/features/profile/store.svelte.js';
	import Button from '#lib/ui/Button.svelte';
	import { istAktiv, setzeAktiv } from '../module-aktiv.svelte.js';

	let { children }: { children: Snippet } = $props();

	const modul = $derived(modulFuerPfad(page.url.pathname));
	// Erst sperren, wenn die Einstellungen geladen sind: sonst blitzt das Tor bei jedem Kaltstart auf,
	// weil bis dahin die Standardwerte (z. B. Training aus) gelten.
	const gesperrt = $derived(
		!!modul && !!authState.session && profileState.loaded && !istAktiv(modul.id)
	);
</script>

{#if gesperrt && modul}
	<section class="mx-auto max-w-md space-y-4 py-12 text-center" aria-labelledby="modul-tor-titel">
		<h1 id="modul-tor-titel" class="text-xl font-semibold text-text-primary">
			{modul.label} ist ausgeschaltet
		</h1>
		<p class="text-sm text-text-secondary">Deine Daten bleiben erhalten.</p>
		<Button onclick={() => setzeAktiv(modul.id, true)}>Einschalten</Button>
	</section>
{:else}
	{@render children()}
{/if}
