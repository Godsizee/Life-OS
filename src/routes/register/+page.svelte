<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { scale } from 'svelte/transition';
	import { Check } from 'lucide-svelte';
	import Alert from '$lib/ui/Alert.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { DURATION, motionDuration } from '$lib/ui/motion';
	import { haptic } from '$lib/core/haptics';
	import AuthShell from '$lib/features/auth/components/AuthShell.svelte';
	import PasswordField from '$lib/features/auth/components/PasswordField.svelte';
	import { signUpWithPassword } from '$lib/features/auth/api';
	import { authErrorText } from '$lib/features/auth/errors';
	import { authErrorCode, focusTargetFor, offersLoginInstead } from '$lib/features/auth/feedback';
	import { safeNextPath } from '$lib/features/auth/redirect';
	import { emailSchema, passwordSchema } from '$lib/features/auth/schema';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let formError = $state('');
	let phase = $state<'idle' | 'submitting' | 'success'>('idle');
	let awaitingConfirmation = $state(false);
	let shaking = $state(false);
	/** Steuert den Ausweg-Link in der Fehlermeldung (Konto existiert bereits). */
	let showLoginLink = $state(false);

	let emailInput = $state<HTMLInputElement | null>(null);
	let passwordInput = $state<HTMLInputElement | null>(null);
	let loginLink = $state<HTMLAnchorElement | null>(null);

	const busy = $derived(phase !== 'idle');
	// Wer über eine Einladung hier landet, soll danach wieder dorthin — das
	// Invite-Token überlebt so den Umweg über die Registrierung.
	const next = $derived(safeNextPath(page.url.searchParams.get('next')));
	// E-Mail wandert mit, damit sie drueben nicht erneut getippt werden muss.
	const loginUrl = $derived(
		`/login?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(next)}`
	);

	function validate(): boolean {
		const mail = emailSchema.safeParse(email.trim());
		emailError = mail.success ? '' : mail.error.issues[0].message;

		const pass = passwordSchema.safeParse(password);
		passwordError = pass.success ? '' : pass.error.issues[0].message;

		return mail.success && pass.success;
	}

	function validateEmailOnBlur() {
		if (!email.trim()) return;
		const mail = emailSchema.safeParse(email.trim());
		emailError = mail.success ? '' : mail.error.issues[0].message;
	}

	async function fail(error: unknown) {
		formError = authErrorText(error);
		const code = authErrorCode(error);
		// Kernpunkt dieses Plans: ein bereits existierendes Konto ist kein Fehler,
		// sondern ein Wegweiser — deshalb Link statt Feld-Fokus.
		showLoginLink = offersLoginInstead(code);

		shaking = false;
		await tick();
		shaking = true;
		haptic([10, 60, 10]);

		await tick();
		if (showLoginLink) {
			loginLink?.focus();
			return;
		}
		const target = focusTargetFor(code);
		if (target === 'email') emailInput?.focus();
		else if (target === 'password') passwordInput?.focus();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		showLoginLink = false;
		if (!validate()) return;

		phase = 'submitting';
		try {
			const { needsConfirmation } = await signUpWithPassword(email, password);
			if (needsConfirmation) {
				phase = 'idle';
				awaitingConfirmation = true;
				haptic(15);
				return;
			}
			phase = 'success';
			haptic(15);
			await new Promise((resolve) => setTimeout(resolve, motionDuration(DURATION.base)));
			// Der DB-Trigger hat Profil und Workspace bereits angelegt — das
			// Onboarding ersetzt nur noch die generierten Namen.
			await goto(`/onboarding?next=${encodeURIComponent(next)}`);
		} catch (error) {
			phase = 'idle';
			await fail(error);
		}
	}
</script>

<svelte:head>
	<title>Registrieren - Life OS</title>
</svelte:head>

{#if awaitingConfirmation}
	<AuthShell title="Fast geschafft" subtitle="Bestätige deine E-Mail-Adresse.">
		{#snippet children()}
			<div
				in:scale={{ start: 0.96, duration: motionDuration(DURATION.base) }}
				class="flex flex-col items-center gap-3 text-center"
			>
				<span
					class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-active-bg text-primary-active"
				>
					<Check size={24} />
				</span>
				<p class="text-sm leading-relaxed text-text-secondary">
					Wir haben eine Nachricht an <strong class="text-text-primary">{email}</strong> geschickt.
					Öffne den Link darin, danach kannst du dich anmelden.
				</p>
			</div>
		{/snippet}
		{#snippet footer()}
			<a href="/login" class="font-medium text-primary-600 underline dark:text-primary-400">
				Zur Anmeldung
			</a>
		{/snippet}
	</AuthShell>
{:else}
	<AuthShell title="Konto anlegen" subtitle="Ein Konto, dein ganzes Leben an einem Ort.">
		<form
			onsubmit={submit}
			class:shake={shaking}
			onanimationend={(event) => {
				if (event.target === event.currentTarget) shaking = false;
			}}
			class="flex flex-col gap-4"
			novalidate
		>
			<Field label="E-Mail" error={emailError} id="register-email">
				<Input
					id="register-email"
					type="email"
					inputmode="email"
					autocomplete="username"
					placeholder="du@beispiel.de"
					bind:value={email}
					bind:element={emailInput}
					invalid={!!emailError}
					disabled={busy}
					aria-describedby={emailError ? 'register-email-error' : undefined}
					oninput={() => (emailError = '')}
					onblur={validateEmailOnBlur}
					required
				/>
			</Field>

			<PasswordField
				bind:value={password}
				bind:element={passwordInput}
				id="new-password"
				autocomplete="new-password"
				error={passwordError}
				hint="Mindestens 8 Zeichen."
				disabled={busy}
				showStrength
			/>

			{#if formError}
				<Alert variant="error">
					{#snippet children()}{formError}{/snippet}
					{#snippet action()}
						{#if showLoginLink}
							<a
								bind:this={loginLink}
								href={loginUrl}
								class="font-medium underline underline-offset-2"
							>
								Jetzt anmelden →
							</a>
						{/if}
					{/snippet}
				</Alert>
			{/if}

			<Button type="submit" loading={phase === 'submitting'} disabled={busy} fullWidth>
				{#snippet icon()}
					{#if phase === 'success'}
						<span in:scale={{ start: 0.5, duration: motionDuration(DURATION.fast) }}>
							<Check size={18} />
						</span>
					{/if}
				{/snippet}
				{#snippet children()}
					{phase === 'submitting'
						? 'Konto wird angelegt…'
						: phase === 'success'
							? 'Angelegt'
							: 'Konto anlegen'}
				{/snippet}
			</Button>
		</form>

		{#snippet footer()}
			<p>
				Schon registriert?
				<a href="/login" class="font-medium text-primary-600 underline dark:text-primary-400">
					Anmelden
				</a>
			</p>
		{/snippet}
	</AuthShell>
{/if}
