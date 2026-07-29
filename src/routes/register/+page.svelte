<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/ui/Button.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import AuthShell from '$lib/features/auth/components/AuthShell.svelte';
	import PasswordField from '$lib/features/auth/components/PasswordField.svelte';
	import { signUpWithPassword } from '$lib/features/auth/api';
	import { authErrorText } from '$lib/features/auth/errors';
	import { safeNextPath } from '$lib/features/auth/redirect';
	import { emailSchema, passwordSchema } from '$lib/features/auth/schema';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let formError = $state('');
	let loading = $state(false);
	let awaitingConfirmation = $state(false);

	// Wer über eine Einladung hier landet, soll danach wieder dorthin — das
	// Invite-Token überlebt so den Umweg über die Registrierung.
	const next = $derived(safeNextPath(page.url.searchParams.get('next')));

	function validate(): boolean {
		const mail = emailSchema.safeParse(email.trim());
		emailError = mail.success ? '' : mail.error.issues[0].message;

		const pass = passwordSchema.safeParse(password);
		passwordError = pass.success ? '' : pass.error.issues[0].message;

		return mail.success && pass.success;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (!validate()) return;

		loading = true;
		try {
			const { needsConfirmation } = await signUpWithPassword(email, password);
			if (needsConfirmation) {
				awaitingConfirmation = true;
				return;
			}
			// Der DB-Trigger hat Profil und Workspace bereits angelegt — das
			// Onboarding ersetzt nur noch die generierten Namen.
			await goto(`/onboarding?next=${encodeURIComponent(next)}`);
		} catch (error) {
			formError = authErrorText(error);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Registrieren - Life OS</title>
</svelte:head>

{#if awaitingConfirmation}
	<AuthShell title="Fast geschafft" subtitle="Bestätige deine E-Mail-Adresse.">
		<p class="text-sm leading-relaxed text-text-secondary">
			Wir haben eine Nachricht an <strong class="text-text-primary">{email}</strong> geschickt. Öffne
			den Link darin, danach kannst du dich anmelden.
		</p>
		{#snippet footer()}
			<a href="/login" class="font-medium text-primary-600 underline dark:text-primary-400">
				Zur Anmeldung
			</a>
		{/snippet}
	</AuthShell>
{:else}
	<AuthShell title="Konto anlegen" subtitle="Ein Konto, dein ganzes Leben an einem Ort.">
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

			<PasswordField
				bind:value={password}
				id="new-password"
				autocomplete="new-password"
				error={passwordError}
				showStrength
			/>

			{#if formError}
				<p role="alert" class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
					{formError}
				</p>
			{/if}

			<Button type="submit" {loading} fullWidth>
				{#snippet children()}Konto anlegen{/snippet}
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
