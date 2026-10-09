<script lang="ts">
	import { Plus, LayoutGrid } from '@lucide/svelte';
	import { profileState } from '#lib/features/profile/store.svelte.js';
	import { resolveNavModules } from '#lib/config/nav.js';
	import type { ModulMeta } from '#lib/config/modules.js';
	import { istAktiv } from '../module-aktiv.svelte.js';
	import { keyboardState } from '#lib/core/keyboard.svelte.js';
	import { haptic } from '#lib/core/haptics.js';

	let {
		currentPath = '/',
		onQuickAdd,
		onMore
	}: {
		currentPath?: string;
		onQuickAdd: () => void;
		onMore: () => void;
	} = $props();

	const navModules = $derived(resolveNavModules(profileState.settings.nav_module_ids, istAktiv));
	const leftItems = $derived(navModules.slice(0, 2));
	const rightItems = $derived(navModules.slice(2));

	function tap() {
		haptic(10);
	}

	function quickAdd() {
		haptic(15);
		onQuickAdd();
	}

	function more() {
		haptic(10);
		onMore();
	}

	// Gemeinsame Form aller Tabs: 48 px hoch, aktiv in der Modulfarbe gefüllt mit Rahmen.
	const tabKlasse =
		'relative flex min-h-12 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 border-[length:var(--rahmen-s)] px-0 py-1';
</script>

{#snippet tab(item: ModulMeta)}
	{@const Icon = item.icon}
	{@const active = currentPath === item.route}
	<a
		href={item.route}
		onclick={tap}
		aria-current={active ? 'page' : undefined}
		style:background-color={active ? `var(${item.farbe})` : undefined}
		class="{tabKlasse} {active ? 'border-tinte text-auf-farbe' : 'border-transparent text-tinte'}"
	>
		<Icon size={20} strokeWidth={active ? 2.5 : 2} />
		<span
			class="mono-label hidden w-full truncate text-center text-[11px] tracking-normal xs:block min-[390px]:text-xs"
			>{item.label}</span
		>
	</a>
{/snippet}

<nav
	aria-label="Hauptnavigation"
	class="select-none-native fixed right-0 bottom-0 left-0 z-30 border-t-[length:var(--rahmen)] border-tinte bg-flaeche pr-safe pb-[env(safe-area-inset-bottom)] pl-safe transition duration-300 md:hidden
		{keyboardState.open ? 'translate-y-full' : 'translate-y-0'}"
	style="view-transition-name: bottom-nav"
>
	<div class="relative mx-auto flex h-16 max-w-lg items-center justify-around gap-0.5 px-1">
		{#each leftItems as item (item.id)}
			{@render tab(item)}
		{/each}

		<!-- Mitte: Erfassen. Etwas festhalten ist die häufigste Aktion der App und gehört in
		     Daumenreichweite. Das Quadrat ragt 12 px über die Leiste. -->
		<button
			type="button"
			onclick={quickAdd}
			aria-label="Schnell erfassen"
			class="druckbar relative -top-3 flex h-14 w-14 shrink-0 items-center justify-center border-[length:var(--rahmen)] border-tinte bg-signal text-auf-farbe"
		>
			<Plus size={26} strokeWidth={3} />
		</button>

		{#each rightItems as item (item.id)}
			{@render tab(item)}
		{/each}

		<button
			type="button"
			onclick={more}
			aria-label="Alle Module"
			class="{tabKlasse} border-transparent text-tinte"
		>
			<LayoutGrid size={20} strokeWidth={2} />
			<span
				class="mono-label hidden w-full truncate text-center text-[11px] tracking-normal xs:block min-[390px]:text-xs"
				>Alle</span
			>
		</button>
	</div>
</nav>
