<script lang="ts">
	import RegelListe from '#lib/features/automationen/components/RegelListe.svelte';
	import { habitsState } from '#lib/features/habits/store.svelte.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';

	// Die Route darf mehrere Features kennen und reicht die Auswahl nach unten.
	const routinen = $derived(habitsState.habits.map((h) => ({ id: h.id, name: h.name })));
</script>

<svelte:head>
	<title>Verknüpfungen - Life OS</title>
</svelte:head>

<a
	href="/settings"
	class="mb-2 inline-flex min-h-10 items-center text-sm font-medium text-text-secondary underline underline-offset-2"
>
	← Einstellungen
</a>
<PageHeader
	title="Verknüpfungen"
	subtitle="Wenn in einem Modul etwas passiert, kann in einem anderen etwas folgen. Du entscheidest, was."
/>

<RegelListe {routinen} />
