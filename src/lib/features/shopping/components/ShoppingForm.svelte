<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { shoppingState } from '../store.svelte';

	let name = $state('');
	let qty = $state('1');
	let unit = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim()) return;
		await shoppingState.addItem({ name, qty: Number(qty) || 1, unit: unit || null });
		name = '';
		qty = '1';
		unit = '';
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<div class="flex gap-2">
		<Input placeholder="Artikel…" bind:value={name} required />
		<Button type="submit">
			{#snippet children()}
				+
			{/snippet}
		</Button>
	</div>
	<div class="flex gap-2">
		<input
			type="number"
			min="0"
			step="0.5"
			placeholder="Menge"
			bind:value={qty}
			class="min-h-12 w-20 rounded-xl border border-border-color bg-surface-0 px-3 text-text-primary focus:border-primary-500 focus:outline-none transition-colors duration-200"
		/>
		<input
			type="text"
			placeholder="Einheit (optional)"
			bind:value={unit}
			class="min-h-12 flex-1 rounded-xl border border-border-color bg-surface-0 px-3 text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none transition-colors duration-200"
		/>
	</div>
</form>
