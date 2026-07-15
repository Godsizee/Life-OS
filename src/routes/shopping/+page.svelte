<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { shoppingState } from '$lib/features/shopping/store.svelte';
	import ShoppingForm from '$lib/features/shopping/components/ShoppingForm.svelte';
	import ShoppingList from '$lib/features/shopping/components/ShoppingList.svelte';
	import Button from '$lib/ui/Button.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import { Plus } from 'lucide-svelte';

	let createOpen = $state(false);

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

<PageHeader title="Einkauf">
	{#snippet trailing()}
		<button
			onclick={() => (createOpen = true)}
			aria-label="Neuer Artikel"
			class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white active:scale-95 transition-transform"
		>
			<Plus size={22} />
		</button>
	{/snippet}
</PageHeader>

<Sheet bind:open={createOpen} title="Neuer Artikel">
	{#snippet children()}
		<div class="p-4">
			<ShoppingForm onsubmitted={() => (createOpen = false)} />
		</div>
	{/snippet}
</Sheet>

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
