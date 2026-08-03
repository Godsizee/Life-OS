<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';
	import { page } from '$app/state';
	import Button from '$lib/ui/Button.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';

	// 404 ist kein Defekt, sondern ein Tippfehler in der Adresse — dafuer eine
	// andere Ansprache als fuer einen echten Absturz.
	const nichtGefunden = $derived(page.status === 404);

	const titel = $derived(nichtGefunden ? 'Seite nicht gefunden' : 'Etwas ist schiefgelaufen');
	const hinweis = $derived(
		nichtGefunden
			? 'Diese Adresse gibt es nicht (mehr).'
			: (page.error?.message ?? 'Unbekannter Fehler')
	);
</script>

<svelte:head><title>{titel} — Life OS</title></svelte:head>

<div class="flex min-h-[60dvh] items-center justify-center px-4">
	<div class="w-full max-w-md">
		<EmptyState icon={AlertTriangle} title={titel} hint={hinweis}>
			{#snippet action()}
				<div class="flex flex-wrap justify-center gap-2">
					{#if !nichtGefunden}
						<Button onclick={() => location.reload()}>Neu laden</Button>
					{/if}
					<Button variant="secondary" onclick={() => location.assign('/')}>Zur Startseite</Button>
				</div>
			{/snippet}
		</EmptyState>

		<!-- Der Statuscode hilft beim Nachfragen, gehoert aber nicht in die Hauptaussage. -->
		<p class="mt-3 text-center text-xs text-text-tertiary">Fehlercode {page.status}</p>
	</div>
</div>
