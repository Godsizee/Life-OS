<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { prefersReducedMotion } from '$lib/ui/motion';
	import { authState } from '$lib/core/auth.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { loadWorkspaceData, unloadWorkspaceData } from '$lib/core/workspace-data';
	import { outbox } from '$lib/core/outbox.svelte';
	import { installState } from '$lib/core/install.svelte';
	import { pushState } from '$lib/core/push.svelte';
	import { themeState } from '$lib/core/theme.svelte';
	import { keyboardState } from '$lib/core/keyboard.svelte';
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
		keyboardState.init();
		online = navigator.onLine;
		void outbox.refreshCounts();
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
			unloadWorkspaceData();
			if (!isPublic) goto('/login');
		} else if (!workspaceState.workspace && !workspaceState.loading) {
			// Einmal zentral statt pro Route — siehe core/workspace-data.ts.
			void workspaceState.load().then(async () => {
				const id = workspaceState.workspace?.id;
				if (id) await loadWorkspaceData(id);
				await outbox.replay();
			});
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
	const wideRoute = $derived(
		page.url.pathname.startsWith('/fitness') || page.url.pathname.startsWith('/tasks')
	);
	let sidebarCollapsed = $state(false);

	interface SyncBanner {
		text: string;
		class: string;
		/** true = Tippen verwirft die unzustellbaren Änderungen statt neu zu senden. */
		verwerfen: boolean;
	}

	const syncBanner = $derived.by<SyncBanner | null>(() => {
		const wartend = outbox.pending > 0 ? ` (${outbox.pending})` : '';
		if (!online) {
			return {
				text: `Offline – Änderungen werden offline gespeichert${wartend}`,
				class: 'bg-slate-700',
				verwerfen: false
			};
		}
		if (outbox.status === 'syncing') {
			return { text: `Synchronisiere…${wartend}`, class: 'bg-primary-700', verwerfen: false };
		}
		if (outbox.status === 'error') {
			return {
				text: `Sync fehlgeschlagen${wartend} – tippen für erneuten Versuch`,
				class: 'bg-red-600',
				verwerfen: false
			};
		}
		// Unzustellbares bleibt sichtbar, statt still verloren zu gehen.
		if (outbox.dead > 0) {
			const mehrzahl = outbox.dead !== 1;
			return {
				text: `${outbox.dead} Änderung${mehrzahl ? 'en' : ''} konnte${mehrzahl ? 'n' : ''} nicht gespeichert werden – tippen zum Verwerfen`,
				class: 'bg-amber-600',
				verwerfen: true
			};
		}
		return null;
	});
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
			{showNav && !keyboardState.open ? 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0' : ''}"
	>
		{#if syncBanner}
			<button
				onclick={() => (syncBanner.verwerfen ? outbox.clearDead() : outbox.replay())}
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
