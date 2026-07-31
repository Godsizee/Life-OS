<script lang="ts">
	// W6 — Fokus-Dauern. Bewusst hier statt in /more: vier Werte würden die
	// Einstellungsliste dominieren, und gebraucht werden sie genau auf dieser Seite.
	import Sheet from '$lib/ui/Sheet.svelte';
	import FocusSettingsFields from '$lib/features/profile/components/FocusSettingsFields.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Sheet bind:open title="Fokus-Einstellungen">
	<div class="px-4 pb-6">
		<FocusSettingsFields />

		<p class="mt-4 text-xs text-text-tertiary">
			Änderungen greifen ab der nächsten Phase — eine laufende Runde behält ihre Dauer.
		</p>
	</div>
</Sheet>
