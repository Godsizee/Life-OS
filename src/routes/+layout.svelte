<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { prefersReducedMotion } from '$lib/ui/motion';
	import { authState } from '$lib/core/auth.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
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
			profileState.unload();
			if (!isPublic) goto('/login');
		} else if (!workspaceState.workspace && !workspaceState.loading) {
			workspaceState.load().then(() => outbox.replay());
			void profileState.load();
		}
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition || prefersReducedMotion()) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	const showNav = $derived(!publicPaths.includes(page.url.pathname));
	// F5 — /fitness bekommt mehr Breite (Desktop-Zwei-Spalten im Live-Workout),
	// statt den mobilen Ein-Spalten-Fluss nur gestreckt breiter darzustellen.
	const wideRoute = $derived(page.url.pathname.startsWith('/fitness'));
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

<div class="flex min-h-dvh bg-[var(--surface-1)] text-[var(--text-primary)] transition-colors duration-300">
	{#if showNav}
		<SidebarNav currentPath={page.url.pathname} bind:collapsed={sidebarCollapsed} />
	{/if}

	<div
		class="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out pt-safe pl-safe pr-safe
			{showNav ? (sidebarCollapsed ? 'md:pl-20' : 'md:pl-64') : ''}
			{showNav ? 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0' : ''}"
	>
		{#if syncBanner}
			<button
				onclick={() => outbox.replay()}
				style="view-transition-name: sync-banner"
				class="min-h-8 w-full px-4 py-1.5 text-center text-xs font-medium text-white {syncBanner.class}"
			>
				{syncBanner.text}
			</button>
		{/if}
		<main class="mx-auto w-full flex-1 p-4 md:p-8 {wideRoute ? 'max-w-6xl' : 'max-w-4xl'}">
			{@render children()}
		</main>
		{#if showNav}
			<BottomNav currentPath={page.url.pathname} />
		{/if}
	</div>
</div>
