<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { scale } from 'svelte/transition';
	import { Check } from 'lucide-svelte';
	import Alert from '$lib/ui/Alert.svelte';
	import Spinner from '$lib/ui/Spinner.svelte';
	import { DURATION, EASE_STANDARD_CSS, motionDuration } from '$lib/ui/motion';
	import { haptic } from '$lib/core/haptics';
	import { authState } from '$lib/core/auth.svelte';
	import AuthShell from '$lib/features/auth/components/AuthShell.svelte';
	import { acceptInvite } from '$lib/features/workspace/api';
	import { loginUrlFor, safeNextPath } from '$lib/features/auth/redirect';

	const REDIRECT_MS = 1500;

	let status = $state<'pending' | 'accepted' | 'invalid' | 'needs-login'>('pending');

	const registerUrl = $derived(
		`/register?next=${encodeURIComponent(safeNextPath(page.url.pathname + page.url.search))}`
	);

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
		acceptInvite(token)
			.then((ok) => {
				status = ok ? 'accepted' : 'invalid';
				if (ok) {
					haptic(15);
					setTimeout(() => goto('/'), REDIRECT_MS);
				}
			})
			// Ohne catch blieb die Seite bei einem Netzwerkfehler fuer immer auf
			// "wird geprueft" stehen.
			.catch(() => (status = 'invalid'));
	});
</script>

<svelte:head>
	<title>Einladung - Life OS</title>
</svelte:head>

<AuthShell title="Einladung" subtitle="Gemeinsamer Bereich in Life OS.">
	{#if status === 'pending'}
		<div class="flex items-center gap-3 text-sm text-text-secondary">
			<Spinner size={18} />
			<span>Einladung wird geprüft…</span>
		</div>
	{:else if status === 'accepted'}
		<div class="flex flex-col gap-3">
			<div
				in:scale={{ start: 0.9, duration: motionDuration(DURATION.base) }}
				class="flex items-center gap-3"
			>
				<span
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-active-bg text-primary-active"
				>
					<Check size={20} />
				</span>
				<p class="text-sm text-text-primary">Einladung angenommen. Du wirst weitergeleitet…</p>
			</div>
			<!-- Sichtbare Wartezeit statt blindem Timeout. -->
			<div class="h-1 w-full overflow-hidden rounded-full bg-surface-3">
				<div
					class="h-full w-full origin-left bg-primary-500"
					style="animation: authRedirectBar {REDIRECT_MS}ms {EASE_STANDARD_CSS} forwards"
				></div>
			</div>
		</div>
	{:else if status === 'needs-login'}
		<div class="flex flex-col gap-3">
			<Alert variant="info">
				{#snippet children()}Bitte zuerst anmelden, um die Einladung anzunehmen.{/snippet}
			</Alert>
			<!-- Mit ?next=, sonst geht das Einladungs-Token beim Login verloren. -->
			<a
				href={loginUrlFor(page.url.pathname, page.url.search)}
				class="font-medium text-primary-600 underline dark:text-primary-400"
			>
				Zur Anmeldung
			</a>
			<a href={registerUrl} class="text-sm text-text-secondary underline">
				Noch kein Konto? Registrieren
			</a>
		</div>
	{:else}
		<Alert variant="error">
			{#snippet children()}Einladung ungültig oder abgelaufen.{/snippet}
			{#snippet action()}
				<a href="/" class="font-medium underline underline-offset-2">Zur Startseite</a>
			{/snippet}
		</Alert>
	{/if}
</AuthShell>
