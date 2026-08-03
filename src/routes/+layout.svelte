<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { prefersReducedMotion } from '$lib/ui/motion';
	import { authState } from '$lib/core/auth.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { loadWorkspaceData, unloadWorkspaceData } from '$lib/core/workspace-data';
	import { fordereAbgleich } from '$lib/core/resync';
	import { outbox } from '$lib/core/outbox.svelte';
	import { installState } from '$lib/core/install.svelte';
	import { pushState } from '$lib/core/push.svelte';
	import { themeState } from '$lib/core/theme.svelte';
	import { keyboardState } from '$lib/core/keyboard.svelte';
	import { toastState } from '$lib/core/toast.svelte';
	import { loginUrlFor } from '$lib/features/auth/redirect';
	import BottomNav from '$lib/ui/BottomNav.svelte';
	import SidebarNav from '$lib/ui/SidebarNav.svelte';
	import CommandPalette from '$lib/ui/CommandPalette.svelte';
	import QuickAddSheet from '$lib/ui/QuickAddSheet.svelte';
	import ModuleGridSheet from '$lib/ui/ModuleGridSheet.svelte';
	import SyncIssuesSheet from '$lib/ui/SyncIssuesSheet.svelte';
	import Toaster from '$lib/ui/Toaster.svelte';
	import AuthSplash from '$lib/features/auth/components/AuthSplash.svelte';
	let { children } = $props();

	let paletteOpen = $state(false);
	let quickAddOpen = $state(false);
	let moduleGridOpen = $state(false);
	let syncIssuesOpen = $state(false);

	const publicPaths = ['/login', '/register', '/invite'];
	// Anmeldung und Onboarding bringen ihren eigenen Rahmen mit (AuthShell);
	// Navigation waere dort nur Ablenkung von der einen offenen Aufgabe.
	const chromelessPaths = [...publicPaths, '/onboarding'];
	let online = $state(true);
	// Nur gesetzt, nachdem wir tatsaechlich eine Sitzung gesehen haben — sonst
	// meldete ein direkter Aufruf einer geschuetzten URL ganz ohne Login
	// faelschlich "Sitzung abgelaufen" statt schlicht "bitte anmelden".
	let hadSession = false;

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
			// Waehrend der Offline-Zeit gemachte Fremdaenderungen hat Realtime nicht
			// zugestellt — ohne Abgleich blieben sie bis zum naechsten Reload unsichtbar.
			fordereAbgleich('online');
		});
		window.addEventListener('offline', () => (online = false));
		// Der haeufigste Fall auf dem Handy: App lag im Hintergrund, das System hat
		// den Socket stillgelegt. Beim Zurueckkehren kommt kein Fehlerstatus,
		// deshalb hier aktiv nachfassen. fordereAbgleich() drosselt selbst.
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') fordereAbgleich('sichtbar');
		});
		window.addEventListener('keydown', (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				paletteOpen = !paletteOpen;
			}
		});
		// hooks.client.ts faengt nur, was beim Navigieren/Rendern hochblubbert.
		// Ein nicht-awaitetes Store-Promise landet dagegen hier — vorher als
		// stumme Konsolenzeile, die im Betrieb niemand sieht.
		window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
			console.error('[app] Unbehandelte Rejection', e.reason);
			toastState.error('Eine Aktion ist fehlgeschlagen');
		});
	});

	$effect(() => {
		if (authState.loading) return;
		const isPublic = publicPaths.includes(page.url.pathname);
		if (!authState.session) {
			// Ein Klick auf "Abmelden" setzt dieses Flag VOR signOut() — beide Faelle
			// loesen denselben SIGNED_OUT-Event aus, aber nur der unerwartete soll
			// den "Sitzung abgelaufen"-Hinweis auf der Login-Seite zeigen.
			const wasIntentional = authState.consumeIntentionalSignOut();
			const wasUnexpected = hadSession && !wasIntentional;
			// Nur beim tatsaechlichen Wechsel von an- zu abgemeldet aufraeumen: sonst
			// feuert der Effekt auf /login bei jeder Session-Neubewertung erneut
			// workspaceState.reset() + unloadWorkspaceData() (~40 State-Schreibvorgaenge
			// ueber 15 Stores) und geriet in Produktion in eine Effect-Update-Schleife
			// (svelte.dev/e/effect_update_depth_exceeded), obwohl nie ein Workspace
			// geladen war.
			if (hadSession) {
				workspaceState.reset();
				unloadWorkspaceData();
			}
			// Ziel mitnehmen, statt es zu verlieren: sonst landet z. B. ein
			// Einladungslink nach dem Login stumm auf dem Dashboard.
			if (!isPublic) {
				goto(loginUrlFor(page.url.pathname, page.url.search, { expired: wasUnexpected }));
			}
		} else if (!workspaceState.workspace && !workspaceState.loading) {
			// Einmal zentral statt pro Route — siehe core/workspace-data.ts.
			void workspaceState
				.load()
				.then(async () => {
					const id = workspaceState.workspace?.id;
					if (id) await loadWorkspaceData(id);
					await outbox.replay();
				})
				// Ohne catch blieb hier eine unbehandelte Rejection stehen und das
				// Onboarding wartete ewig auf einen Workspace, der nie kam.
				.catch(() => {});
		}
		hadSession = !!authState.session;
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

	const showNav = $derived(!chromelessPaths.includes(page.url.pathname));
	// F5 — /fitness bekommt mehr Breite (Desktop-Zwei-Spalten im Live-Workout),
	// statt den mobilen Ein-Spalten-Fluss nur gestreckt breiter darzustellen.
	const wideRoute = $derived(
		page.url.pathname.startsWith('/fitness') || page.url.pathname.startsWith('/tasks')
	);
	let sidebarCollapsed = $state(false);

	interface SyncBanner {
		text: string;
		class: string;
		/** true = Tippen öffnet die Liste der unzustellbaren Änderungen. */
		zeigeProbleme: boolean;
	}

	const syncBanner = $derived.by<SyncBanner | null>(() => {
		const wartend = outbox.pending > 0 ? ` (${outbox.pending})` : '';
		if (!online) {
			return {
				text: `Offline – Änderungen werden offline gespeichert${wartend}`,
				class: 'bg-surface-3 text-text-primary',
				zeigeProbleme: false
			};
		}
		if (outbox.status === 'syncing') {
			return {
				text: `Synchronisiere…${wartend}`,
				class: 'bg-primary-700 text-white',
				zeigeProbleme: false
			};
		}
		if (outbox.status === 'error') {
			return {
				text: `Sync fehlgeschlagen${wartend} – tippen für erneuten Versuch`,
				class: 'bg-red-600 text-white',
				zeigeProbleme: false
			};
		}
		// Unzustellbares bleibt sichtbar, statt still verloren zu gehen.
		if (outbox.dead > 0) {
			const mehrzahl = outbox.dead !== 1;
			return {
				text: `${outbox.dead} Änderung${mehrzahl ? 'en' : ''} konnte${mehrzahl ? 'n' : ''} nicht gespeichert werden – tippen für Details`,
				class: 'bg-amber-600 text-white',
				zeigeProbleme: true
			};
		}
		return null;
	});
</script>

<CommandPalette bind:open={paletteOpen} />
<QuickAddSheet bind:open={quickAddOpen} />
<ModuleGridSheet bind:open={moduleGridOpen} currentPath={page.url.pathname} />
<SyncIssuesSheet bind:open={syncIssuesOpen} />
<Toaster />

{#if authState.loading}
	<AuthSplash />
{:else}
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
				onclick={() => (syncBanner.zeigeProbleme ? (syncIssuesOpen = true) : outbox.replay())}
				style="view-transition-name: sync-banner"
				class="min-h-8 w-full px-4 py-1.5 text-center text-xs font-medium {syncBanner.class}"
			>
				{syncBanner.text}
			</button>
		{/if}
		<main
			class="mx-auto w-full flex-1 {showNav ? 'p-4 md:p-8' : ''} {wideRoute
				? 'max-w-6xl'
				: 'max-w-4xl'}"
		>
			{@render children()}
		</main>
		{#if showNav}
			<BottomNav
				currentPath={page.url.pathname}
				onQuickAdd={() => (quickAddOpen = true)}
				onMore={() => (moduleGridOpen = true)}
			/>
		{/if}
	</div>
</div>
{/if}
