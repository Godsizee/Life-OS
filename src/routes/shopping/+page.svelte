<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { shoppingState } from '$lib/features/shopping/store.svelte';
	import ShoppingForm from '$lib/features/shopping/components/ShoppingForm.svelte';
	import ShoppingList from '$lib/features/shopping/components/ShoppingList.svelte';
	import Button from '$lib/ui/Button.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) shoppingState.load(id);
	});
	onDestroy(() => shoppingState.unload());

	const hasChecked = $derived(shoppingState.items.some((i) => i.checked));
</script>

<svelte:head>
	<title>Einkauf - Life OS</title>
</svelte:head>

<PageHeader title="Einkauf" />

<section class="mb-4">
	<ShoppingForm />
</section>

<section class="flex flex-col gap-4">
	<ShoppingList items={shoppingState.items} />
	{#if hasChecked}
		<Button variant="secondary" onclick={() => shoppingState.clearChecked()}>
			{#snippet children()}
				Erledigte löschen
			{/snippet}
		</Button>
	{/if}
</section>
