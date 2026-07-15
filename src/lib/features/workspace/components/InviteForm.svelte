<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { workspaceState } from '../store.svelte';

	let email = $state('');
	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		status = 'sending';
		try {
			await workspaceState.invite(email);
			email = '';
			status = 'sent';
		} catch {
			status = 'error';
		}
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-3">
	<label class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-text-primary">Partner einladen</span>
		<Input type="email" placeholder="partner@email.de" bind:value={email} required />
	</label>
	<Button type="submit" disabled={status === 'sending'}>
		{#snippet children()}
			{status === 'sending' ? 'Sende…' : 'Einladung erstellen'}
		{/snippet}
	</Button>
	{#if status === 'sent'}
		<p class="text-sm text-primary-600">Einladung erstellt.</p>
	{:else if status === 'error'}
		<p class="text-sm text-red-600">Einladung fehlgeschlagen.</p>
	{/if}
</form>
