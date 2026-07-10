<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/core/supabase';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';

	let mode = $state<'login' | 'signup'>('login');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		loading = true;
		try {
			const { error: authError } =
				mode === 'login'
					? await supabase.auth.signInWithPassword({ email, password })
					: await supabase.auth.signUp({ email, password });
			if (authError) {
				error = authError.message;
				return;
			}
			await goto('/');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Anmelden - Life OS</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<form onsubmit={submit} class="flex w-full max-w-sm flex-col gap-4">
		<h1 class="text-2xl font-bold tracking-tight">
			{mode === 'login' ? 'Anmelden' : 'Registrieren'}
		</h1>

		<Input type="email" placeholder="E-Mail" bind:value={email} required />
		<Input type="password" placeholder="Passwort" bind:value={password} required />

		{#if error}
			<p class="text-sm text-red-600">{error}</p>
		{/if}

		<Button type="submit" disabled={loading}>
			{#snippet children()}
				{mode === 'login' ? 'Anmelden' : 'Registrieren'}
			{/snippet}
		</Button>

		<button
			type="button"
			class="text-sm text-text-secondary hover:text-text-primary transition-colors"
			onclick={() => (mode = mode === 'login' ? 'signup' : 'login')}
		>
			{mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Schon registriert? Anmelden'}
		</button>
	</form>
</div>
