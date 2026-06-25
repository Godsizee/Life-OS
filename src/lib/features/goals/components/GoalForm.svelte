<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { goalsState } from '../store.svelte';

	let title = $state('');
	let targetDate = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim()) return;
		await goalsState.addGoal({ title, target_date: targetDate || null });
		title = '';
		targetDate = '';
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<Input placeholder="Neues Ziel…" bind:value={title} required />
	<input
		type="date"
		bind:value={targetDate}
		class="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 focus:border-emerald-500 focus:outline-none"
	/>
	<Button type="submit">
		{#snippet children()}
			Hinzufügen
		{/snippet}
	</Button>
</form>
