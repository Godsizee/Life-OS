<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fade, scale } from 'svelte/transition';
	import { Check, Fingerprint } from 'lucide-svelte';
	import Alert from '$lib/ui/Alert.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { DURATION, motionDuration } from '$lib/ui/motion';
	import { haptic } from '$lib/core/haptics';
	import AuthShell from '$lib/features/auth/components/AuthShell.svelte';
	import PasswordField from '$lib/features/auth/components/PasswordField.svelte';
	import { signInWithPasskey, signInWithPassword } from '$lib/features/auth/api';
	import { passkeyAvailable } from '$lib/features/auth/capabilities';
	import { SESSION_EXPIRED_MESSAGE, authErrorText } from '$lib/features/auth/errors';
	import { authErrorCode, focusTargetFor } from '$lib/features/auth/feedback';
	import { safeNextPath } from '$lib/features/auth/redirect';
	import { emailSchema } from '$lib/features/auth/schema';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let formError = $state('');
	// Ein Zustand statt zweier loser Flags: vorher liefen Passwort- und Passkey-Weg
	// unabhaengig, beide Buttons blieben klickbar und die Felder editierbar.
	let phase = $state<'idle' | 'password' | 'passkey' | 'success'>('idle');
	let passkeyReady = $state(false);
	let resetHintOpen = $state(false);
	let shaking = $state(false);

	let emailInput = $state<HTMLInputElement | null>(null);
	let passwordInput = $state<HTMLInputElement | null>(null);
	// Kein $state: nur ein Einmal-Riegel fuer den $effect, kein UI-Zustand.
	let focusSet = false;

	const busy = $derived(phase !== 'idle');
	// Der Auth-Guard hängt das ursprüngliche Ziel an; safeNextPath lässt nur
	// eigene, relative Pfade durch.
	const next = $derived(safeNextPath(page.url.searchParams.get('next')));
	// Vom Auth-Guard gesetzt, wenn eine bestehende Sitzung unerwartet verschwand.
	const showExpiredNotice = $derived(page.url.searchParams.get('expired') === '1');

	$effect(() => {
		// Der Passkey-Weg erscheint nur, wenn Browser UND Server ihn können —
		// siehe features/auth/capabilities.ts.
		void passkeyAvailable().then((ok) => (passkeyReady = ok));
	});

	$effect(() => {
		// Einmalig, sonst ueberschreibt ein spaeterer URL-Wechsel die Eingabe.
		if (focusSet) return;
		focusSet = true;
		// Aus der Registrierung uebernommen ("Konto existiert bereits") — dann fehlt
		// nur noch das Passwort, also direkt dorthin.
		const prefill = page.url.searchParams.get('email');
		if (prefill) {
			email = prefill;
			void tick().then(() => passwordInput?.focus());
		} else {
			void tick().then(() => emailInput?.focus());
		}
	});

	function validateEmail(): boolean {
		const result = emailSchema.safeParse(email.trim());
		emailError = result.success ? '' : result.error.issues[0].message;
		return result.success;
	}

	/** Beim Verlassen pruefen, aber ein noch leeres Feld nicht vorwurfsvoll anmeckern. */
	function validateOnBlur() {
		if (email.trim()) validateEmail();
	}

	/** Fehler wahrnehmbar machen: Meldung + Wackeln + Haptik + Fokus aufs schuldige Feld. */
	async function fail(error: unknown) {
		formError = authErrorText(error);
		// Erst aus, dann an — sonst startet die Animation beim zweiten Fehler nicht neu.
		shaking = false;
		await tick();
		shaking = true;
		haptic([10, 60, 10]);

		const target = focusTargetFor(authErrorCode(error));
		await tick();
		if (target === 'email') emailInput?.focus();
		else if (target === 'password') passwordInput?.focus();
	}

	/** Kurz halten, damit der Erfolg sichtbar wird, bevor die Seite wechselt. */
	async function succeed() {
		phase = 'success';
		haptic(15);
		await new Promise((resolve) => setTimeout(resolve, motionDuration(DURATION.base)));
		await goto(next);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (!validateEmail()) {
			emailInput?.focus();
			return;
		}

		phase = 'password';
		try {
			await signInWithPassword(email, password);
			await succeed();
		} catch (error) {
			phase = 'idle';
			await fail(error);
		}
	}

	async function passkeyLogin() {
		formError = '';
		phase = 'passkey';
		try {
			await signInWithPasskey();
			await succeed();
		} catch (error) {
			phase = 'idle';
			await fail(error);
		}
	}
</script>

<svelte:head>
	<title>Anmelden - Life OS</title>
</svelte:head>

<AuthShell title="Willkommen zurück" subtitle="Melde dich an, um weiterzumachen.">
	{#if showExpiredNotice}
		<Alert variant="info">
			{#snippet children()}
				{SESSION_EXPIRED_MESSAGE} Noch nicht synchronisierte Änderungen bleiben gespeichert.
			{/snippet}
		</Alert>
	{/if}

	<form
		onsubmit={submit}
		class:shake={shaking}
		onanimationend={(event) => {
			// Nur die eigene Wackel-Animation zuruecksetzen: animationend blubbert,
			// und die Svelte-Transitions der Kinder wuerden sie sonst sofort abwuergen.
			if (event.target === event.currentTarget) shaking = false;
		}}
		class="flex flex-col gap-4"
		novalidate
	>
		<Field label="E-Mail" error={emailError} id="login-email">
			<Input
				id="login-email"
				type="email"
				inputmode="email"
				autocomplete="username"
				placeholder="du@beispiel.de"
				bind:value={email}
				bind:element={emailInput}
				invalid={!!emailError}
				disabled={busy}
				aria-describedby={emailError ? 'login-email-error' : undefined}
				oninput={() => (emailError = '')}
				onblur={validateOnBlur}
				required
			/>
		</Field>

		<PasswordField
			bind:value={password}
			bind:element={passwordInput}
			autocomplete="current-password"
			disabled={busy}
		/>

		{#if formError}
			<Alert variant="error">
				{#snippet children()}{formError}{/snippet}
			</Alert>
		{/if}

		<Button type="submit" loading={phase === 'password'} disabled={busy} fullWidth>
			{#snippet icon()}
				{#if phase === 'success'}
					<span in:scale={{ start: 0.5, duration: motionDuration(DURATION.fast) }}>
						<Check size={18} />
					</span>
				{/if}
			{/snippet}
			{#snippet children()}
				{phase === 'password' ? 'Wird angemeldet…' : phase === 'success' ? 'Angemeldet' : 'Anmelden'}
			{/snippet}
		</Button>

		{#if passkeyReady}
			<!-- Einblenden statt hartem Pop-in: die Server-Probe laeuft asynchron. -->
			<div
				transition:fade={{ duration: motionDuration(DURATION.base) }}
				class="flex flex-col gap-4"
			>
				<div class="flex items-center gap-3 text-xs text-text-tertiary">
					<span class="h-px flex-1 bg-border-color"></span>
					oder
					<span class="h-px flex-1 bg-border-color"></span>
				</div>
				<Button
					variant="secondary"
					loading={phase === 'passkey'}
					disabled={busy}
					onclick={passkeyLogin}
					fullWidth
				>
					{#snippet icon()}<Fingerprint size={18} />{/snippet}
					{#snippet children()}
						{phase === 'passkey' ? 'Passkey wird geprüft…' : 'Mit Passkey anmelden'}
					{/snippet}
				</Button>
			</div>
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
