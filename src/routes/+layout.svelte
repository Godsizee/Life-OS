<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authState } from '$lib/core/auth.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { outbox } from '$lib/core/outbox.svelte';
	import { installState } from '$lib/core/install.svelte';
	import { pushState } from '$lib/core/push.svelte';
	import { themeState } from '$lib/core/theme.svelte';
	import BottomNav from '$lib/ui/BottomNav.svelte';
	import SidebarNav from '$lib/ui/SidebarNav.svelte';
	import CommandPalette from '$lib/ui/CommandPalette.svelte';
	import Toaster from '$lib/ui/Toaster.svelte';
	let { children } = $props();

	let paletteOpen = $state(false);

	const publicPaths = ['/login', '/invite'];
	let online = $state(true);

	onMount(() => {
		authState.init();
		installState.init();
		pushState.init();
		themeState.init();
		online = navigator.onLine;
		window.addEventListener('online', () => {
			online = true;
			outbox.replay();
		});
		window.addEventListener('offline', () => (online = false));
		window.addEventListener('keydown', (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				paletteOpen = !paletteOpen;
			}
		});
	});

	$effect(() => {
		if (authState.loading) return;
		const isPublic = publicPaths.includes(page.url.pathname);
		if (!authState.session) {
			workspaceState.reset();
			if (!isPublic) goto('/login');
		} else if (!workspaceState.workspace && !workspaceState.loading) {
			workspaceState.load().then(() => outbox.replay());
		}
	});

	const showNav = $derived(!publicPaths.includes(page.url.pathname));
	let sidebarCollapsed = $state(false);

	const syncBanner = $derived(
		!online
			? { text: 'Offline – Änderungen werden offline gespeichert', class: 'bg-slate-700' }
			: outbox.status === 'syncing'
				? { text: 'Synchronisiere…', class: 'bg-primary-700' }
				: outbox.status === 'error'
					? { text: 'Sync fehlgeschlagen – tippen für erneuten Versuch', class: 'bg-red-600' }
					: null
	);
</script>

<CommandPalette bind:open={paletteOpen} />
<Toaster />

<div class="flex min-h-screen bg-[var(--surface-1)] text-[var(--text-primary)] transition-colors duration-300">
	{#if showNav}
		<SidebarNav currentPath={page.url.pathname} bind:collapsed={sidebarCollapsed} />
	{/if}

	<div
		class="flex flex-1 flex-col transition-all duration-300 ease-in-out
			{showNav ? (sidebarCollapsed ? 'md:pl-20' : 'md:pl-64') : ''}
			{showNav ? 'pb-16 md:pb-0' : ''}"
	>
		{#if syncBanner}
			<button
				onclick={() => outbox.replay()}
				class="min-h-8 w-full px-4 py-1.5 text-center text-xs font-medium text-white {syncBanner.class}"
			>
				{syncBanner.text}
			</button>
		{/if}
		<main class="mx-auto w-full max-w-4xl flex-1 p-4 md:p-8">
			{@render children()}
		</main>
		{#if showNav}
			<BottomNav currentPath={page.url.pathname} />
		{/if}
	</div>
</div>
