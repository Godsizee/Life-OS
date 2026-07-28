<script lang="ts">
	import { Plus, LayoutGrid } from 'lucide-svelte';
	import { bottomNavModules } from '$lib/config/modules';
	import { keyboardState } from '$lib/core/keyboard.svelte';
	import { haptic } from '$lib/core/haptics';

	let {
		currentPath = '/',
		onQuickAdd,
		onMore
	}: {
		currentPath?: string;
		onQuickAdd: () => void;
		onMore: () => void;
	} = $props();

	const leftItems = bottomNavModules.slice(0, 2);
	const rightItems = bottomNavModules.slice(2);

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
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-30 border-t border-border-color bg-surface-0 pb-[env(safe-area-inset-bottom)] pl-safe pr-safe md:hidden select-none-native transition duration-300
		{keyboardState.open ? 'translate-y-full' : 'translate-y-0'}"
	style="view-transition-name: bottom-nav"
>
	<div class="relative mx-auto flex h-16 max-w-lg items-center justify-around gap-0.5 px-1 xs:px-3">
		{#each leftItems as item (item.id)}
			{@const Icon = item.icon}
			{@const active = currentPath === item.route}
			<a
				href={item.route}
				onclick={tap}
				aria-current={active ? 'page' : undefined}
				class="relative flex min-h-12 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 transition-transform active:scale-95
					{active ? 'text-primary-600 dark:text-primary-400' : 'text-text-secondary'}"
			>
				<Icon size={20} strokeWidth={active ? 2.5 : 2} />
				<span class="hidden w-full truncate text-center text-[10px] font-medium xs:block">{item.label}</span>
				{#if active}
					<span class="absolute bottom-1.5 h-1 w-4 rounded bg-primary-600 dark:bg-primary-400"></span>
				{/if}
			</a>
		{/each}

		<!-- Mitte: Schnellerfassung. Etwas festhalten ist die haeufigste Aktion der
		     App und gehoert deshalb in Daumenreichweite – Fokus liegt im Modul-Grid. -->
		<button
			type="button"
			onclick={quickAdd}
			aria-label="Schnell erfassen"
			class="relative -top-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white transition-all active:scale-90 elevation-2 hero-gradient"
		>
			<Plus size={24} strokeWidth={2.5} />
		</button>

		{#each rightItems as item (item.id)}
			{@const Icon = item.icon}
			{@const active = currentPath === item.route}
			<a
				href={item.route}
				onclick={tap}
				aria-current={active ? 'page' : undefined}
				class="relative flex min-h-12 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 transition-transform active:scale-95
					{active ? 'text-primary-600 dark:text-primary-400' : 'text-text-secondary'}"
			>
				<Icon size={20} strokeWidth={active ? 2.5 : 2} />
				<span class="hidden w-full truncate text-center text-[10px] font-medium xs:block">{item.label}</span>
				{#if active}
					<span class="absolute bottom-1.5 h-1 w-4 rounded bg-primary-600 dark:bg-primary-400"></span>
				{/if}
			</a>
		{/each}

		<button
			type="button"
			onclick={more}
			aria-label="Alle Module"
			class="relative flex min-h-12 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-text-secondary transition-transform active:scale-95"
		>
			<LayoutGrid size={20} strokeWidth={2} />
			<span class="hidden w-full truncate text-center text-[10px] font-medium xs:block">Mehr</span>
		</button>
	</div>
</nav>
