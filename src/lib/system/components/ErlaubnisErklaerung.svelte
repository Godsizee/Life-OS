<script lang="ts">
	import { braucheInstallation, erlaubnis, type ErlaubnisArt } from '#lib/core/erlaubnis.svelte.js';
	import { installState } from '#lib/core/install.svelte.js';
	import Button from '#lib/ui/Button.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';

	let { art }: { art: ErlaubnisArt } = $props();

	const TEXTE: Record<ErlaubnisArt, { titel: string; bekommst: string; abschalten: string }> = {
		push: {
			titel: 'Erinnerungen aufs Gerät',
			bekommst:
				'Erinnerungen, die du selbst eingerichtet hast, zum Beispiel für den Wochenrückblick oder einen Termin. Sie kommen auch, wenn die App geschlossen ist.',
			abschalten: 'Einstellungen → Benachrichtigungen → Push-Benachrichtigungen'
		},
		timer: {
			titel: 'Signal bei Timer-Ende',
			bekommst:
				'Ein Signal, wenn eine Fokus-Runde oder eine Pause endet, auch wenn die App im Hintergrund läuft.',
			abschalten: 'Einstellungen → Benachrichtigungen → Timer-Signale'
		}
	};

	let open = $state(true);
	$effect(() => {
		if (!open) erlaubnis.lehneAb();
	});

	const text = $derived(TEXTE[art]);
	const nurInstalliert = $derived(
		braucheInstallation(
			typeof navigator === 'undefined' ? '' : navigator.userAgent,
			installState.installed
		)
	);
</script>

<Sheet bind:open title="Benachrichtigungen erlauben">
	<div class="flex flex-col gap-4 p-4">
		<h3 class="text-2xl font-extrabold [font-stretch:85%]">{text.titel}</h3>
		{#if nurInstalliert}
			<p>
				Auf dem iPhone kommen Benachrichtigungen nur in der installierten App. So installierst du
				sie: Teilen → Zum Home-Bildschirm.
			</p>
			<Button onclick={() => (open = false)}>Verstanden</Button>
		{:else}
			<dl class="m-0 flex flex-col gap-3">
				<div>
					<dt class="mono-label text-text-3">Was du bekommst</dt>
					<dd class="m-0">{text.bekommst}</dd>
				</div>
				<div>
					<dt class="mono-label text-text-3">Was du nicht bekommst</dt>
					<dd class="m-0">Keine Werbung. Keine Daten an Dritte.</dd>
				</div>
				<div>
					<dt class="mono-label text-text-3">Jederzeit abschaltbar</dt>
					<dd class="m-0">{text.abschalten}</dd>
				</div>
			</dl>
			<p class="text-sm text-text-2">Danach fragt dein Browser noch einmal nach.</p>
			<div class="flex flex-wrap gap-2">
				<Button onclick={() => erlaubnis.bestaetige()}>Erlauben</Button>
				<Button variant="sekundaer" onclick={() => (open = false)}>Nicht jetzt</Button>
			</div>
		{/if}
	</div>
</Sheet>
