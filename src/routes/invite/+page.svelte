<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authState } from '$lib/core/auth.svelte';
	import { acceptInvite } from '$lib/features/workspace/api';

	let status = $state<'pending' | 'accepted' | 'invalid' | 'needs-login'>('pending');

	$effect(() => {
		if (authState.loading) return;
		const token = page.url.searchParams.get('token');
		if (!token) {
			status = 'invalid';
			return;
		}
		if (!authState.session) {
			status = 'needs-login';
			return;
		}
		acceptInvite(token).then((ok) => {
			status = ok ? 'accepted' : 'invalid';
			if (ok) setTimeout(() => goto('/'), 1500);
		});
	});
</script>

<svelte:head>
	<title>Einladung - Life OS</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4 text-center">
	{#if status === 'pending'}
		<p class="text-slate-500">Einladung wird geprüft…</p>
	{:else if status === 'accepted'}
		<p class="text-primary-600">Einladung angenommen. Du wirst weitergeleitet…</p>
	{:else if status === 'needs-login'}
		<div class="flex flex-col gap-3">
			<p class="text-slate-700">Bitte zuerst anmelden, um die Einladung anzunehmen.</p>
			<a href="/login" class="text-primary-600 underline">Zur Anmeldung</a>
		</div>
	{:else}
		<p class="text-red-600">Einladung ungültig oder abgelaufen.</p>
	{/if}
</div>
