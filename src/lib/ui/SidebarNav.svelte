<script lang="ts">
	import { modules } from '$lib/config/modules';
	import { authState } from '$lib/core/auth.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { themeState } from '$lib/core/theme.svelte';
	import { outbox } from '$lib/core/outbox.svelte';
	import { goto } from '$app/navigation';
	import { LogOut, Sun, Moon, ChevronLeft, ChevronRight, CloudLightning } from 'lucide-svelte';

	let { currentPath = '/', collapsed = $bindable(false) }: { currentPath?: string, collapsed?: boolean } = $props();

	$effect(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('sidebar_collapsed');
			collapsed = saved === 'true';
		}
	});

	function toggleCollapse() {
		collapsed = !collapsed;
		try {
			localStorage.setItem('sidebar_collapsed', String(collapsed));
		} catch {}
	}

	async function logout() {
		await authState.signOut();
		workspaceState.reset();
		await outbox.clear();
		await goto('/login');
	}
</script>

<aside
	class="fixed bottom-0 top-0 left-0 z-30 hidden border-r border-border-color bg-surface-0 transition-all duration-300 ease-in-out md:flex md:flex-col
		{collapsed ? 'w-20' : 'w-64'}"
	style="view-transition-name: sidebar"
>
	<!-- Header / Logo -->
	<div class="flex h-16 items-center justify-between border-b border-border-color px-4">
		{#if !collapsed}
			<div class="flex items-center gap-2 overflow-hidden">
				<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white font-bold premium-shadow">
					L
				</div>
				<div class="flex flex-col min-w-0">
					<span class="truncate text-sm font-bold tracking-tight text-text-primary">Life OS</span>
					<span class="truncate text-[10px] text-text-secondary">
						{workspaceState.workspace?.name ?? 'Lädt...'}
					</span>
				</div>
			</div>
		{:else}
			<div class="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white font-bold">
				L
			</div>
		{/if}

		<button
			onclick={toggleCollapse}
			class="hidden items-center justify-center rounded-lg p-1.5 text-text-tertiary hover:bg-surface-2 hover:text-text-primary md:flex"
			aria-label="Sidebar einklappen"
		>
			{#if collapsed}
				<ChevronRight size={16} />
			{:else}
				<ChevronLeft size={16} />
			{/if}
		</button>
	</div>

	<!-- Module Links -->
	<nav class="flex-1 overflow-y-auto p-3 space-y-1">
		{#each modules as item (item.id)}
			{@const Icon = item.icon}
			{@const active = currentPath === item.route}
			<a
				href={item.route}
				class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group
					{active 
						? 'bg-primary-active-bg text-primary-active font-semibold' 
						: 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'}"
			>
				<!-- Active Indicator Line -->
				{#if active}
					<div class="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-primary-active"></div>
				{/if}

				<Icon size={20} class="shrink-0 {active ? 'text-primary-active' : 'text-text-tertiary'}" />
				
				{#if !collapsed}
					<span class="truncate">{item.label}</span>
				{:else}
					<!-- Tooltip on Collapse -->
					<div class="absolute left-16 z-50 hidden rounded-md bg-slate-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-slate-800">
						{item.label}
					</div>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Sync / Info Status (only show when active/syncing) -->
	{#if outbox.status === 'syncing'}
		<div class="flex items-center gap-2 px-6 py-2 text-xs text-primary-active animate-pulse-subtle">
			<CloudLightning size={14} />
			{#if !collapsed}
				<span>Synchronisiere...</span>
			{/if}
		</div>
	{/if}

	<!-- Footer -->
	<div class="border-t border-border-color p-3 space-y-2">
		<!-- Dark Mode Toggle -->
		<button
			onclick={() => themeState.toggle()}
			class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary"
		>
			{#if themeState.isDark}
				<Sun size={20} class="shrink-0 text-amber-500" />
				{#if !collapsed}
					<span class="truncate">Helles Design</span>
				{/if}
			{:else}
				<Moon size={20} class="shrink-0 text-text-tertiary" />
				{#if !collapsed}
					<span class="truncate">Dunkles Design</span>
				{/if}
			{/if}
		</button>

		<!-- Log Out -->
		<button
			onclick={logout}
			class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
		>
			<LogOut size={20} class="shrink-0" />
			{#if !collapsed}
				<span class="truncate">Abmelden</span>
			{/if}
		</button>

		<!-- User Avatar/Info -->
		{#if authState.user}
			<div class="flex items-center gap-3 pt-2 px-1">
				<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-active-bg text-sm font-bold text-primary-active">
					{authState.user.email?.[0].toUpperCase() ?? 'U'}
				</div>
				{#if !collapsed}
					<div class="flex flex-col min-w-0">
						<span class="truncate text-xs font-semibold text-text-primary">
							{authState.user.email}
						</span>
						<span class="truncate text-[10px] text-text-secondary">Mitglied</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</aside>
