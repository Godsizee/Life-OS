<script lang="ts">
	import { goto } from '$app/navigation';
	import { authState } from '$lib/core/auth.svelte';
	import { outbox } from '$lib/core/outbox.svelte';
	import { installState } from '$lib/core/install.svelte';
	import { pushState } from '$lib/core/push.svelte';
	import { themeState } from '$lib/core/theme.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import { modules } from '$lib/config/modules';
	import InviteForm from '$lib/features/workspace/components/InviteForm.svelte';
	import MemberList from '$lib/features/workspace/components/MemberList.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import Button from '$lib/ui/Button.svelte';

	const moreLinks = modules.filter((m) =>
		['habits', 'shopping', 'goals', 'mood', 'health', 'review', 'fitness', 'analytics', 'timeline'].includes(m.id)
	);

	async function logout() {
		await authState.signOut();
		workspaceState.reset();
		await outbox.clear();
		await goto('/login');
	}
</script>

<svelte:head>
	<title>Mehr - Life OS</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-2xl font-bold tracking-tight">Mehr</h1>
	<p class="text-text-secondary">{workspaceState.workspace?.name ?? ''}</p>
</header>

<section class="flex flex-col gap-6">
	<div class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 font-semibold text-text-primary">Module</h2>
		<ul class="flex flex-col gap-1">
			{#each moreLinks as link (link.id)}
				{@const Icon = link.icon}
				<li>
					<a
						href={link.route}
						class="flex min-h-12 items-center gap-3 rounded-xl px-2 text-text-primary hover:bg-surface-1 active:bg-surface-2 transition-colors"
					>
						<Icon size={20} class="text-text-secondary" />
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</div>

	<div class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 font-semibold text-text-primary">Mitglieder</h2>
		<MemberList members={workspaceState.members} />
	</div>

	<div class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<InviteForm />
	</div>

	<div class="flex flex-col gap-3 rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="font-semibold text-text-primary">App & Einstellungen</h2>

		<!-- Trainingsziel/Woche -->
		<label class="flex min-h-12 items-center justify-between gap-3 px-2 text-text-primary">
			<span>🏋️ Trainingsziel pro Woche</span>
			<input
				type="number"
				min="1"
				max="14"
				value={profileState.weeklyWorkoutGoal}
				onchange={(e) => profileState.setWeeklyWorkoutGoal(Number(e.currentTarget.value))}
				class="w-16 min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-center text-sm text-text-primary focus:border-primary-500 focus:outline-none"
			/>
		</label>

		<!-- Dark-Mode-Toggle -->
		<button
			onclick={() => themeState.toggle()}
			class="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 text-text-primary hover:bg-surface-1 active:bg-surface-2 transition-colors"
		>
			<span>{themeState.isDark ? '☀️ Helles Design' : '🌙 Dunkles Design'}</span>
			<span
				class="flex h-6 w-11 items-center rounded-full p-0.5 transition-colors {themeState.isDark
					? 'bg-primary-700'
					: 'bg-surface-3 border border-border-color/50'}"
			>
				<span
					class="h-5 w-5 rounded-full bg-white transition-transform {themeState.isDark
						? 'translate-x-5'
						: ''}"
				></span>
			</span>
		</button>

		{#if installState.canInstall}
			<button
				onclick={() => installState.install()}
				class="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 text-text-primary hover:bg-surface-1 active:bg-surface-2 transition-colors"
			>
				<span class="truncate">App installieren</span>
				<span class="shrink-0 text-xs text-primary-600 dark:text-primary-400 font-medium">Installieren</span>
			</button>
		{:else if installState.installed}
			<p class="text-sm text-text-secondary px-2">App ist installiert.</p>
		{/if}

		{#if pushState.supported}
			<button
				onclick={() => (pushState.subscribed ? pushState.unsubscribe() : pushState.subscribe())}
				disabled={pushState.loading}
				class="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 text-text-primary hover:bg-surface-1 active:bg-surface-2 transition-colors disabled:opacity-50"
			>
				<span class="truncate">Push-Benachrichtigungen</span>
				<span
					class="flex h-6 w-11 items-center rounded-full p-0.5 transition-colors {pushState.subscribed
						? 'bg-primary-700'
						: 'bg-surface-3 border border-border-color/50'}"
				>
					<span
						class="h-5 w-5 rounded-full bg-white transition-transform {pushState.subscribed
							? 'translate-x-5'
							: ''}"
					></span>
				</span>
			</button>
			{#if pushState.permission === 'denied'}
				<p class="text-xs text-text-secondary px-2">
					Benachrichtigungen sind im Browser blockiert. Bitte in den Browser-Einstellungen erlauben.
				</p>
			{/if}
		{/if}
	</div>

	<Button variant="secondary" onclick={logout}>
		{#snippet children()}
			Abmelden
		{/snippet}
	</Button>

	<p class="text-center text-xs text-text-tertiary">
		Übungsdatenbank basiert auf <a href="https://wger.de" class="underline hover:text-text-secondary">wger.de</a> (CC-BY-SA).
	</p>
</section>
