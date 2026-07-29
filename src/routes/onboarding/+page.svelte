<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authState } from '$lib/core/auth.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import AuthShell from '$lib/features/auth/components/AuthShell.svelte';
	import { authErrorText } from '$lib/features/auth/errors';
	import { safeNextPath } from '$lib/features/auth/redirect';
	import { onboardingSchema } from '$lib/features/auth/schema';
	import { updateDisplayName } from '$lib/features/profile/api';
	import { workspaceState } from '$lib/features/workspace/store.svelte';

	let displayName = $state('');
	let workspaceName = $state('');
	let errors = $state<{ displayName?: string; workspaceName?: string }>({});
	let formError = $state('');
	let saving = $state(false);
	let prefilled = false;

	const next = $derived(safeNextPath(page.url.searchParams.get('next')));
	const isOwner = $derived(workspaceState.workspace?.owner_id === authState.user?.id);

	/** `handle_new_user` legt "mail@host's Workspace" an — kein Name, den man behalten will. */
	function isGeneratedName(name: string): boolean {
		return name.endsWith("'s Workspace");
	}

	function suggestNameFrom(email: string): string {
		const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
		return local ? local.charAt(0).toUpperCase() + local.slice(1) : '';
	}

	$effect(() => {
		// Einmalig vorbelegen, sobald Session und Workspace geladen sind — danach
		// nicht mehr, sonst überschreibt ein Store-Update die Eingabe des Nutzers.
		if (prefilled) return;
		const workspace = workspaceState.workspace;
		const email = authState.user?.email;
		if (!workspace || !email) return;

		prefilled = true;
		displayName = suggestNameFrom(email);
		workspaceName = isGeneratedName(workspace.name) ? 'Mein Haushalt' : workspace.name;
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';

		const result = onboardingSchema.safeParse({ displayName, workspaceName });
		if (!result.success) {
			errors = {
				displayName: result.error.issues.find((i) => i.path[0] === 'displayName')?.message,
				workspaceName: result.error.issues.find((i) => i.path[0] === 'workspaceName')?.message
			};
			return;
		}
		errors = {};

		const userId = authState.user?.id;
		if (!userId) {
			formError = 'Die Sitzung ist abgelaufen. Bitte erneut anmelden.';
			return;
		}

		saving = true;
		try {
			await updateDisplayName(userId, result.data.displayName);
			// Mitglieder fremder Workspaces dürfen nicht umbenennen (RLS).
			if (isOwner) await workspaceState.rename(result.data.workspaceName);
			await goto(next);
		} catch (error) {
			formError = authErrorText(error);
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Willkommen - Life OS</title>
</svelte:head>

<AuthShell title="Kurz vorstellen" subtitle="Zwei Angaben, danach geht es los.">
	{#if workspaceState.loading || !workspaceState.workspace}
		<p class="text-sm text-text-secondary">Dein Bereich wird vorbereitet…</p>
	{:else}
		<form onsubmit={submit} class="flex flex-col gap-4" novalidate>
			<Field label="Dein Name" hint="So wirst du anderen Mitgliedern angezeigt." error={errors.displayName}>
				<Input
					autocomplete="given-name"
					placeholder="Alex"
					bind:value={displayName}
					invalid={!!errors.displayName}
					required
				/>
			</Field>

			{#if isOwner}
				<Field label="Name deines Bereichs" hint="Lässt sich später jederzeit ändern." error={errors.workspaceName}>
					<Input
						placeholder="Mein Haushalt"
						bind:value={workspaceName}
						invalid={!!errors.workspaceName}
						required
					/>
				</Field>
			{/if}

			{#if formError}
				<p role="alert" class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
					{formError}
				</p>
			{/if}

			<Button type="submit" loading={saving} fullWidth>
				{#snippet children()}Los geht's{/snippet}
			</Button>
		</form>
	{/if}

	{#snippet footer()}
		<a href={next} class="min-h-11 text-text-tertiary underline transition-colors hover:text-text-primary">
			Später ausfüllen
		</a>
	{/snippet}
</AuthShell>
