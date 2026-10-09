<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { dev } from '$app/env';
	import { prefersReducedMotion } from '#lib/ui/motion.js';
	import { authState } from '#lib/core/auth.svelte.js';
	import { workspaceState } from '#lib/features/workspace/store.svelte.js';
	import { ladeAlles, entladeAlles } from '#lib/system/daten.js';
	import { starteSystem } from '#lib/system/start.js';
	import { richteAutomationenEin } from '#lib/system/automationen.js';
	import { uebernehmeBestand } from '#lib/system/bestand.js';
	import ModulTor from '#lib/system/components/ModulTor.svelte';
	import { fordereAbgleich } from '#lib/core/resync.js';
	import { outbox } from '#lib/core/outbox.svelte.js';
	import { installState } from '#lib/core/install.svelte.js';
	import { pushState } from '#lib/features/reminders/push.svelte.js';
	import { themeState } from '#lib/core/theme.svelte.js';
	import { keyboardState } from '#lib/core/keyboard.svelte.js';
	import { panel } from '#lib/core/panel.svelte.js';
	import { toastState } from '#lib/core/toast.svelte.js';
	import { loginUrlFor } from '#lib/features/auth/redirect.js';
	import UntereLeiste from '#lib/system/components/UntereLeiste.svelte';
	import Seitenleiste from '#lib/system/components/Seitenleiste.svelte';
	import Suche from '#lib/system/components/Suche.svelte';
	import Erfassen from '#lib/system/components/Erfassen.svelte';
	import AlleModule from '#lib/system/components/AlleModule.svelte';
	import SyncIssuesSheet from '#lib/ui/SyncIssuesSheet.svelte';
	import Toaster from '#lib/ui/Toaster.svelte';
	import AuthSplash from '#lib/features/auth/components/AuthSplash.svelte';
	import Baender from '#lib/system/components/Baender.svelte';
	import { starteAppBadge } from '#lib/system/badge.svelte.js';
	let { children } = $props();

	let paletteOpen = $state(false);
	let quickAddOpen = $state(false);
	let moduleGridOpen = $state(false);
	let syncIssuesOpen = $state(false);

	const publicPaths = ['/login', '/register', '/invite'];
	// Anmeldung und Onboarding bringen ihren eigenen Rahmen mit (AuthShell);
	// Navigation waere dort nur Ablenkung von der einen offenen Aufgabe.
	const chromelessPaths = [...publicPaths, '/onboarding'];
	// Der Styleguide unter /dev/ läuft nur im Dev-Server und braucht weder Anmeldung noch Navigation.
	const istDevPfad = (pfad: string) => dev && pfad.startsWith('/dev/');
	let online = $state(true);
	// Nur gesetzt, nachdem wir tatsaechlich eine Sitzung gesehen haben — sonst
	// meldete ein direkter Aufruf einer geschuetzten URL ganz ohne Login
	// faelschlich "Sitzung abgelaufen" statt schlicht "bitte anmelden".
	let hadSession = false;

	/** Tippt die Person gerade in ein Feld? Dann gehören Buchstaben dem Feld, nicht den Kürzeln. */
	function inEingabe(ziel: EventTarget | null): boolean {
		if (!(ziel instanceof HTMLElement)) return false;
		return ziel.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(ziel.tagName);
	}

	/** Globale Tastenkürzel: `/` Suche, `n` Erfassen. `?` (Hilfe) folgt mit T501. */
	function kuerzel(e: KeyboardEvent) {
		if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || inEingabe(e.target)) return;
		if (!showNav || paletteOpen || quickAddOpen || moduleGridOpen) return;
		if (e.key === '/') {
			e.preventDefault();
			paletteOpen = true;
		} else if (e.key === 'n') {
			e.preventDefault();
			quickAddOpen = true;
		}
	}

	onMount(() => {
		starteSystem();
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
				return;
			}
			kuerzel(e);
		});
		// hooks.client.ts faengt nur, was beim Navigieren/Rendern hochblubbert.
		// Ein nicht-awaitetes Store-Promise landet dagegen hier — vorher als
		// stumme Konsolenzeile, die im Betrieb niemand sieht.
		window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
			console.error('[app] Unbehandelte Rejection', e.reason);
			toastState.error('Eine Aktion ist fehlgeschlagen');
		});
		return starteAppBadge();
	});

	$effect(() => {
		if (authState.loading) return;
		const isPublic = publicPaths.includes(page.url.pathname) || istDevPfad(page.url.pathname);
		if (!authState.session) {
			// Ein Klick auf "Abmelden" setzt dieses Flag VOR signOut() — beide Faelle
			// loesen denselben SIGNED_OUT-Event aus, aber nur der unerwartete soll
			// den "Sitzung abgelaufen"-Hinweis auf der Login-Seite zeigen.
			const wasIntentional = authState.consumeIntentionalSignOut();
			const wasUnexpected = hadSession && !wasIntentional;
			// Nur beim tatsaechlichen Wechsel von an- zu abgemeldet aufraeumen: sonst
			// feuert der Effekt auf /login bei jeder Session-Neubewertung erneut
			// workspaceState.reset() + entladeAlles() (~40 State-Schreibvorgaenge
			// ueber 15 Stores) und geriet in Produktion in eine Effect-Update-Schleife
			// (svelte.dev/e/effect_update_depth_exceeded), obwohl nie ein Workspace
			// geladen war.
			if (hadSession) {
				workspaceState.reset();
				entladeAlles();
			}
			// Ziel mitnehmen, statt es zu verlieren: sonst landet z. B. ein
			// Einladungslink nach dem Login stumm auf dem Dashboard.
			if (!isPublic) {
				goto(loginUrlFor(page.url.pathname, page.url.search, { expired: wasUnexpected }));
			}
		} else if (!workspaceState.workspace && !workspaceState.loading) {
			// Einmal zentral statt pro Route — siehe system/daten.ts.
			void workspaceState
				.load()
				.then(async () => {
					const id = workspaceState.workspace?.id;
					if (id) {
						await ladeAlles(id);
						// Zuerst die Module: ruhende Regeln (Training, Gesundheit) hängen an ihnen.
						await uebernehmeBestand();
						await richteAutomationenEin();
					}
					await outbox.replay();
				})
				// Ohne catch blieb hier eine unbehandelte Rejection stehen und das
				// Onboarding wartete ewig auf einen Workspace, der nie kam.
				.catch(() => {});
		}
		hadSession = !!authState.session;
	});

	// Kurzbefehl der installierten App („Erfassen“, `/?erfassen=1`): Blatt einmal öffnen, den Parameter
	// danach entfernen, damit ein Neuladen es nicht erneut öffnet.
	$effect(() => {
		if (page.url.searchParams.get('erfassen') !== '1') return;
		if (authState.loading || !authState.session) return;
		quickAddOpen = true;
		void goto(page.url.pathname, { replaceState: true, reset: false });
	});

	onNavigate((navigation) => {
		if (navigation.shallow && navigation.type === 'goto') return;
		if (!document.startViewTransition || prefersReducedMotion()) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	const showNav = $derived(
		!chromelessPaths.includes(page.url.pathname) && !istDevPfad(page.url.pathname)
	);
	// F5 — /fitness bekommt mehr Breite (Desktop-Zwei-Spalten im Live-Workout),
	// statt den mobilen Ein-Spalten-Fluss nur gestreckt breiter darzustellen.
	const wideRoute = $derived(
		page.url.pathname.startsWith('/fitness') || page.url.pathname.startsWith('/tasks')
	);
	let sidebarCollapsed = $state(false);
</script>

<Suche bind:open={paletteOpen} />
<Erfassen bind:open={quickAddOpen} />
<AlleModule bind:open={moduleGridOpen} currentPath={page.url.pathname} />
<SyncIssuesSheet bind:open={syncIssuesOpen} />
<Toaster />

{#if authState.loading}
	<AuthSplash />
{:else}
	<div class="flex min-h-dvh bg-seite text-tinte">
		{#if showNav}
			<a
				href="#inhalt"
				class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:border-[length:var(--rahmen)] focus:border-tinte focus:bg-signal focus:px-4 focus:py-3 focus:font-semibold focus:text-auf-farbe"
			>
				Zum Inhalt springen
			</a>
		{/if}
		{#if showNav}
			<Seitenleiste currentPath={page.url.pathname} bind:collapsed={sidebarCollapsed} />
		{/if}

		<div
			class="flex min-w-0 flex-1 flex-col pt-safe pr-safe pl-safe transition-all duration-300 ease-in-out
			{showNav ? (sidebarCollapsed ? 'md:pl-20' : 'md:pl-64') : ''}
			{panel.panelOffen ? 'xl:pr-[420px]' : ''}
			{showNav && !keyboardState.open ? 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0' : ''}"
		>
			<Baender {online} onProbleme={() => (syncIssuesOpen = true)} />
			<main
				id="inhalt"
				tabindex="-1"
				class="mx-auto w-full flex-1 outline-none {showNav ? 'p-4 md:p-8' : ''} {wideRoute
					? 'max-w-6xl'
					: 'max-w-4xl'}"
			>
				<ModulTor>{@render children()}</ModulTor>
			</main>
			{#if showNav}
				<UntereLeiste
					currentPath={page.url.pathname}
					onQuickAdd={() => (quickAddOpen = true)}
					onMore={() => (moduleGridOpen = true)}
				/>
			{/if}
		</div>
	</div>
{/if}
