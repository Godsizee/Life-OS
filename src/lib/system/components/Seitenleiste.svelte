<script lang="ts">
	import { aktiveModule } from '../module-aktiv.svelte.js';
	import { nachBereich } from '#lib/config/bereiche.js';
	import { authState } from '#lib/core/auth.svelte.js';
	import { workspaceState } from '#lib/features/workspace/store.svelte.js';
	import { themeState } from '#lib/core/theme.svelte.js';
	import { logout, logoutState } from '#lib/features/auth/logout.svelte.js';
	import {
		LogOut,
		Sun,
		Moon,
		ChevronLeft,
		ChevronRight,
		Settings,
		CircleHelp
	} from '@lucide/svelte';
	import Spinner from '#lib/ui/Spinner.svelte';
	import Wortmarke from '#lib/ui/Wortmarke.svelte';
	import Tastenhinweis from '#lib/ui/Tastenhinweis.svelte';

	let {
		currentPath = '/',
		collapsed = $bindable(false)
	}: { currentPath?: string; collapsed?: boolean } = $props();

	const gruppen = $derived(nachBereich(aktiveModule.meta));

	$effect(() => {
		if (typeof window === 'undefined') return;
		const saved = localStorage.getItem('sidebar_collapsed');
		if (saved !== null) {
			collapsed = saved === 'true';
			return;
		}
		// Ohne ausdrueckliche Wahl richtet sich der Startzustand nach der Breite:
		// zwischen 768px und 1024px liegt u. a. das aufgeklappte Galaxy Z Fold
		// (~928px). Dort kostet die breite Leiste zu viel von der Inhaltsspalte.
		const mq = window.matchMedia('(min-width: 1024px)');
		collapsed = !mq.matches;
		const onChange = (e: MediaQueryListEvent) => (collapsed = !e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	function toggleCollapse() {
		collapsed = !collapsed;
		try {
			localStorage.setItem('sidebar_collapsed', String(collapsed));
		} catch {}
	}

	const eintrag =
		'group relative flex min-h-10 items-center gap-3 border-[length:var(--rahmen-s)] px-3 py-1.5 text-sm font-semibold';
	const tooltip =
		'absolute left-16 z-50 hidden border-[length:var(--rahmen-s)] border-tinte bg-flaeche px-2 py-1 text-xs font-medium whitespace-nowrap text-tinte group-hover:block group-focus-visible:block';
</script>

<aside
	class="fixed top-0 bottom-0 left-0 z-30 hidden border-r-[length:var(--rahmen)] border-tinte bg-flaeche pt-safe pl-safe transition-all duration-300 ease-in-out md:flex md:flex-col
		{collapsed ? 'w-20' : 'w-64'}"
	style="view-transition-name: sidebar"
>
	<!-- Kopf: Wortmarke und Haushalt. Eingeklappt bleibt nur der Umschalter mit dem Logo. -->
	<div
		class="flex h-16 shrink-0 items-center border-b-[length:var(--rahmen-s)] border-tinte px-3
			{collapsed ? 'justify-center' : 'justify-between'}"
	>
		{#if !collapsed}
			<div class="flex min-w-0 flex-col items-start gap-1">
				<Wortmarke size="sm" />
				<span class="mono-label max-w-full truncate text-text-3">
					{workspaceState.workspace?.name ?? 'Lädt …'}
				</span>
			</div>
			<button
				onclick={toggleCollapse}
				class="flex h-12 w-12 shrink-0 items-center justify-center hover:bg-flaeche-2"
				aria-label="Seitenleiste einklappen"
			>
				<ChevronLeft size={18} />
			</button>
		{:else}
			<button
				onclick={toggleCollapse}
				class="group relative flex h-12 w-12 shrink-0 items-center justify-center hover:bg-flaeche-2"
				aria-label="Seitenleiste ausklappen"
			>
				<img
					src="/favicon.svg"
					alt=""
					class="h-9 w-9 object-cover transition-opacity group-hover:opacity-0"
				/>
				<ChevronRight
					size={18}
					class="absolute opacity-0 transition-opacity group-hover:opacity-100"
				/>
			</button>
		{/if}
	</div>

	<!-- Module nach Bereich. Der Punkt zeigt die Modulfarbe, der aktive Eintrag ist damit gefüllt. -->
	<nav aria-label="Module" class="flex-1 overflow-y-auto p-3">
		{#each gruppen as gruppe, i (gruppe.bereich.id)}
			<section aria-labelledby={collapsed ? undefined : `seite-bereich-${gruppe.bereich.id}`}>
				{#if !collapsed}
					<h2 id="seite-bereich-{gruppe.bereich.id}" class="mono-label px-1 pt-3 pb-1 text-text-3">
						{gruppe.bereich.label}
					</h2>
				{:else if i > 0}
					<hr class="my-2 border-t-[length:var(--rahmen-s)] border-tinte/30" />
				{/if}
				<ul class="flex flex-col gap-1">
					{#each gruppe.eintraege as item (item.id)}
						{@const Icon = item.icon}
						{@const active = currentPath === item.route}
						<li>
							<a
								href={item.route}
								aria-current={active ? 'page' : undefined}
								aria-label={collapsed ? item.label : undefined}
								style:background-color={active ? `var(${item.farbe})` : undefined}
								class="{eintrag} {collapsed ? 'justify-center' : ''}
									{active ? 'border-tinte text-auf-farbe' : 'border-transparent text-tinte hover:bg-flaeche-2'}"
							>
								{#if !collapsed}
									<span
										class="h-3 w-3 shrink-0 border-[length:var(--rahmen-s)] border-tinte"
										style:background-color="var({item.farbe})"
										aria-hidden="true"
									></span>
								{/if}
								<Icon size={20} class="shrink-0" />
								{#if !collapsed}
									<span class="truncate">{item.label}</span>
								{:else}
									<span class={tooltip} aria-hidden="true">{item.label}</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</nav>

	<!-- Fuß: Hilfe, Einstellungen, Design, Abmelden. Die Tooltips im eingeklappten Zustand
	     brauchen `group relative` auf dem Element. -->
	<div class="shrink-0 border-t-[length:var(--rahmen-s)] border-tinte p-3">
		{#if !collapsed}
			<p class="mono-label flex flex-wrap items-center gap-x-2 gap-y-1 px-1 pb-2 text-text-3">
				<span><Tastenhinweis taste="N" /> Neu</span>
				<span><Tastenhinweis taste="/" /> Suchen</span>
			</p>
		{/if}
		<ul class="flex flex-col gap-1">
			<li>
				<a
					href="/hilfe"
					aria-current={currentPath.startsWith('/hilfe') ? 'page' : undefined}
					aria-label={collapsed ? 'Hilfe' : undefined}
					class="{eintrag} border-transparent hover:bg-flaeche-2 {collapsed
						? 'justify-center'
						: ''}"
				>
					<CircleHelp size={20} class="shrink-0" />
					{#if !collapsed}<span class="truncate">Hilfe</span>{:else}<span
							class={tooltip}
							aria-hidden="true">Hilfe</span
						>{/if}
				</a>
			</li>
			<li>
				<a
					href="/settings"
					aria-current={currentPath === '/settings' ? 'page' : undefined}
					aria-label={collapsed ? 'Einstellungen' : undefined}
					class="{eintrag} {collapsed ? 'justify-center' : ''}
						{currentPath === '/settings'
						? 'border-tinte bg-signal text-auf-farbe'
						: 'border-transparent hover:bg-flaeche-2'}"
				>
					<Settings size={20} class="shrink-0" />
					{#if !collapsed}<span class="truncate">Einstellungen</span>{:else}<span
							class={tooltip}
							aria-hidden="true">Einstellungen</span
						>{/if}
				</a>
			</li>
			<li>
				<button
					onclick={() => themeState.toggle()}
					aria-label={collapsed
						? themeState.isDark
							? 'Helles Design'
							: 'Dunkles Design'
						: undefined}
					class="{eintrag} w-full border-transparent hover:bg-flaeche-2 {collapsed
						? 'justify-center'
						: ''}"
				>
					{#if themeState.isDark}
						<Sun size={20} class="shrink-0" />
					{:else}
						<Moon size={20} class="shrink-0" />
					{/if}
					{#if !collapsed}
						<span class="truncate">{themeState.isDark ? 'Helles Design' : 'Dunkles Design'}</span>
					{:else}
						<span class={tooltip} aria-hidden="true"
							>{themeState.isDark ? 'Helles Design' : 'Dunkles Design'}</span
						>
					{/if}
				</button>
			</li>
			<li>
				<button
					onclick={logout}
					disabled={logoutState.loading}
					aria-busy={logoutState.loading}
					aria-label={collapsed ? 'Abmelden' : undefined}
					class="{eintrag} w-full border-transparent text-gefahr hover:bg-flaeche-2 disabled:opacity-50 {collapsed
						? 'justify-center'
						: ''}"
				>
					{#if logoutState.loading}
						<Spinner size={20} />
					{:else}
						<LogOut size={20} class="shrink-0" />
					{/if}
					{#if !collapsed}
						<span class="truncate">{logoutState.loading ? 'Melde ab …' : 'Abmelden'}</span>
					{:else}
						<span class={tooltip} aria-hidden="true">Abmelden</span>
					{/if}
				</button>
			</li>
		</ul>

		{#if authState.user}
			<div
				class="mt-2 flex items-center gap-3 border-t-[length:var(--rahmen-s)] border-tinte px-1 pt-3 {collapsed
					? 'justify-center'
					: ''}"
			>
				<!-- Zweites `?.`: bei leerer (nicht nur fehlender) E-Mail griff die
				     Optional-Chain nicht und .toUpperCase() lief auf undefined. -->
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center border-[length:var(--rahmen-s)] border-tinte bg-signal text-sm font-extrabold text-auf-farbe"
					aria-hidden="true"
				>
					{authState.user.email?.[0]?.toUpperCase() ?? 'U'}
				</div>
				{#if !collapsed}
					<span class="min-w-0 truncate text-xs font-semibold">{authState.user.email}</span>
				{/if}
			</div>
		{/if}
	</div>
</aside>
