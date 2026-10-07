<script lang="ts">
	import Verlauf from '#lib/features/automationen/components/Verlauf.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>Verlauf der Verknüpfungen - Life OS</title>
</svelte:head>

<a
	href="/settings/automationen"
	class="mb-2 inline-flex min-h-10 items-center text-sm font-medium text-text-secondary underline underline-offset-2"
>
	← Verknüpfungen
</a>
<PageHeader title="Verlauf" subtitle="Was Verknüpfungen auf diesem Gerät getan haben" />

<Verlauf />
