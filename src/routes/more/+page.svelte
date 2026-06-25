<script lang="ts">
	import { goto } from '$app/navigation';
	import { authState } from '$lib/core/auth.svelte';
	import { outbox } from '$lib/core/outbox.svelte';
	import { installState } from '$lib/core/install.svelte';
	import { pushState } from '$lib/core/push.svelte';
	import { modules } from '$lib/config/modules';
	import InviteForm from '$lib/features/workspace/components/InviteForm.svelte';
	import MemberList from '$lib/features/workspace/components/MemberList.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import Button from '$lib/ui/Button.svelte';

	const moreLinks = modules.filter((m) => ['habits', 'shopping', 'goals'].includes(m.id));

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
	<p class="text-slate-500">{workspaceState.workspace?.name ?? ''}</p>
</header>

<section class="flex flex-col gap-6">
	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
		<h2 class="mb-3 font-semibold text-slate-700">Module</h2>
		<ul class="flex flex-col gap-1">
			{#each moreLinks as link (link.id)}
				{@const Icon = link.icon}
				<li>
					<a
						href={link.route}
						class="flex min-h-12 items-center gap-3 rounded-xl px-2 text-slate-700 active:bg-slate-100"
					>
						<Icon size={20} />
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</div>

	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
		<h2 class="mb-3 font-semibold text-slate-700">Mitglieder</h2>
		<MemberList members={workspaceState.members} />
	</div>

	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
		<InviteForm />
	</div>

	<div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
		<h2 class="font-semibold text-slate-700">App & Benachrichtigungen</h2>

		{#if installState.canInstall}
			<button
				onclick={() => installState.install()}
				class="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 text-slate-700 active:bg-slate-100"
			>
				<span class="truncate">App installieren</span>
				<span class="shrink-0 text-xs text-emerald-600">Installieren</span>
			</button>
		{:else if installState.installed}
			<p class="text-sm text-slate-500">App ist installiert.</p>
		{/if}

		{#if pushState.supported}
			<button
				onclick={() => (pushState.subscribed ? pushState.unsubscribe() : pushState.subscribe())}
				disabled={pushState.loading}
				class="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 text-slate-700 active:bg-slate-100 disabled:opacity-50"
			>
				<span class="truncate">Push-Benachrichtigungen</span>
				<span
					class="shrink-0 flex h-6 w-11 items-center rounded-full p-0.5 transition-colors {pushState.subscribed
						? 'bg-emerald-600'
						: 'bg-slate-300'}"
				>
					<span
						class="h-5 w-5 rounded-full bg-white transition-transform {pushState.subscribed
							? 'translate-x-5'
							: ''}"
					></span>
				</span>
			</button>
			{#if pushState.permission === 'denied'}
				<p class="text-xs text-slate-500">
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
</section>
