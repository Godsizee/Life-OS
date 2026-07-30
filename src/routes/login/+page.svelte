<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Fingerprint } from 'lucide-svelte';
	import Button from '$lib/ui/Button.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import AuthShell from '$lib/features/auth/components/AuthShell.svelte';
	import PasswordField from '$lib/features/auth/components/PasswordField.svelte';
	import { signInWithPasskey, signInWithPassword } from '$lib/features/auth/api';
	import { passkeyAvailable } from '$lib/features/auth/capabilities';
	import { SESSION_EXPIRED_MESSAGE, authErrorText } from '$lib/features/auth/errors';
	import { safeNextPath } from '$lib/features/auth/redirect';
	import { emailSchema } from '$lib/features/auth/schema';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let formError = $state('');
	let loading = $state(false);
	let passkeyLoading = $state(false);
	let passkeyReady = $state(false);
	let resetHintOpen = $state(false);

	// Der Auth-Guard hängt das ursprüngliche Ziel an; safeNextPath lässt nur
	// eigene, relative Pfade durch.
	const next = $derived(safeNextPath(page.url.searchParams.get('next')));
	// Vom Auth-Guard gesetzt, wenn eine bestehende Sitzung unerwartet verschwand
	// (Server-Refresh fehlgeschlagen) statt durch Klick auf "Abmelden" — sonst
	// landet der Nutzer kommentarlos auf dieser Seite und haelt es fuer einen Bug.
	const showExpiredNotice = $derived(page.url.searchParams.get('expired') === '1');

	$effect(() => {
		// Der Passkey-Weg erscheint nur, wenn Browser UND Server ihn können —
		// siehe features/auth/capabilities.ts.
		void passkeyAvailable().then((ok) => (passkeyReady = ok));
	});

	function validateEmail(): boolean {
		const result = emailSchema.safeParse(email.trim());
		emailError = result.success ? '' : result.error.issues[0].message;
		return result.success;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (!validateEmail()) return;

		loading = true;
		try {
			await signInWithPassword(email, password);
			await goto(next);
		} catch (error) {
			formError = authErrorText(error);
		} finally {
			loading = false;
		}
	}

	async function passkeyLogin() {
		formError = '';
		passkeyLoading = true;
		try {
			await signInWithPasskey();
			await goto(next);
		} catch (error) {
			formError = authErrorText(error);
		} finally {
			passkeyLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Anmelden - Life OS</title>
</svelte:head>

<AuthShell title="Willkommen zurück" subtitle="Melde dich an, um weiterzumachen.">
	{#if showExpiredNotice}
		<p class="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
			{SESSION_EXPIRED_MESSAGE}
		</p>
	{/if}
	<form onsubmit={submit} class="flex flex-col gap-4" novalidate>
		<Field label="E-Mail" error={emailError}>
			<Input
				type="email"
				inputmode="email"
				autocomplete="username"
				placeholder="du@beispiel.de"
				bind:value={email}
				invalid={!!emailError}
				oninput={() => (emailError = '')}
				required
			/>
		</Field>

		<PasswordField bind:value={password} autocomplete="current-password" />

		{#if formError}
			<p role="alert" class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
				{formError}
			</p>
		{/if}

		<Button type="submit" {loading} fullWidth>
			{#snippet children()}Anmelden{/snippet}
		</Button>

		{#if passkeyReady}
			<div class="flex items-center gap-3 text-xs text-text-tertiary">
				<span class="h-px flex-1 bg-border-color"></span>
				oder
				<span class="h-px flex-1 bg-border-color"></span>
			</div>
			<Button variant="secondary" loading={passkeyLoading} onclick={passkeyLogin} fullWidth>
				{#snippet icon()}<Fingerprint size={18} />{/snippet}
				{#snippet children()}Mit Passkey anmelden{/snippet}
			</Button>
		{/if}
	</form>

	{#snippet footer()}
		<p>
			Noch kein Konto?
			<a href="/register" class="font-medium text-primary-600 underline dark:text-primary-400">
				Registrieren
			</a>
		</p>

		<button
			type="button"
			onclick={() => (resetHintOpen = !resetHintOpen)}
			aria-expanded={resetHintOpen}
			class="min-h-11 text-text-tertiary underline transition-colors hover:text-text-primary"
		>
			Passwort vergessen?
		</button>

		{#if resetHintOpen}
			<!-- Ehrlich statt stumme Sackgasse: ohne SMTP kann der Server keine
			     Zurücksetzen-Mail verschicken. -->
			<p class="rounded-xl bg-surface-2 px-3 py-2 text-left text-xs leading-relaxed text-text-secondary">
				Life OS verschickt im Pilotbetrieb noch keine E-Mails, ein automatisches Zurücksetzen ist
				deshalb nicht möglich. Melde dich bei der Person, die dich eingeladen hat — sie kann das
				Passwort im Supabase-Studio neu setzen.
			</p>
		{/if}
	{/snippet}
</AuthShell>
