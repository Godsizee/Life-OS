<script lang="ts">
	import { logout, logoutState } from '$lib/features/auth/logout.svelte';
	import { modules } from '$lib/config/modules';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import Button from '$lib/ui/Button.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';

	const moreLinks = modules.filter((m) =>
		['habits', 'shopping', 'goals', 'journal', 'mood', 'health', 'review', 'fitness', 'analytics', 'timeline'].includes(m.id)
	);
</script>

<svelte:head>
	<title>Mehr - Life OS</title>
</svelte:head>

<PageHeader title="Mehr" subtitle={workspaceState.workspace?.name ?? ''} />

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
		<ul class="flex flex-col gap-1">
			<li>
				<a
					href="/settings"
					class="flex min-h-12 items-center gap-3 rounded-xl px-2 text-text-primary hover:bg-surface-1 active:bg-surface-2 transition-colors"
				>
					<span class="text-xl">⚙️</span>
					Einstellungen
				</a>
			</li>
		</ul>
	</div>

	<Button variant="secondary" onclick={logout} loading={logoutState.loading}>
		{#snippet children()}
			{logoutState.loading ? 'Melde ab…' : 'Abmelden'}
		{/snippet}
	</Button>

	<p class="text-center text-xs text-text-tertiary">
		Übungsdatenbank basiert auf <a href="https://wger.de" class="underline hover:text-text-secondary">wger.de</a> (CC-BY-SA).
	</p>
</section>
