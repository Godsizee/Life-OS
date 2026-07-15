<script lang="ts">
	import { Settings, Zap } from 'lucide-svelte';
	import { modules } from '$lib/config/modules';

	let { currentPath = '/' }: { currentPath?: string } = $props();

	const navModuleIds = ['dashboard', 'tasks', 'notes', 'calendar'];
	const leftItems = modules
		.filter((m) => navModuleIds.slice(0, 2).includes(m.id))
		.map((m) => ({ name: m.label, path: m.route, icon: m.icon }));
	const rightItems = modules
		.filter((m) => navModuleIds.slice(2).includes(m.id))
		.map((m) => ({ name: m.label, path: m.route, icon: m.icon }));

	function triggerVibration() {
		if (typeof navigator !== 'undefined' && navigator.vibrate) {
			navigator.vibrate(10);
		}
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-30 border-t border-border-color bg-surface-0 pb-[env(safe-area-inset-bottom)] pl-safe pr-safe md:hidden select-none-native transition-colors duration-300"
	style="view-transition-name: bottom-nav"
>
	<div class="relative mx-auto flex h-16 max-w-lg items-center justify-around gap-0.5 px-1 xs:px-3">
		{#each leftItems as item}
			{@const Icon = item.icon}
			{@const active = currentPath === item.path}
			<a
				href={item.path}
				onclick={triggerVibration}
				class="relative flex min-h-12 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5
					{active ? 'text-primary-600 dark:text-primary-400' : 'text-text-secondary'}
					active:scale-95 transition-transform"
			>
				<Icon size={20} strokeWidth={active ? 2.5 : 2} />
				<span class="w-full truncate text-center text-[10px] font-medium xs:text-xs">{item.name}</span>
				{#if active}
					<span class="absolute bottom-1.5 h-1 w-4 rounded bg-primary-600 dark:bg-primary-400"></span>
				{/if}
			</a>
		{/each}

		<!-- Mitte: Fokus-FAB -->
		<a
			href="/focus"
			onclick={triggerVibration}
			class="relative -top-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-lg transition-all active:scale-90 premium-shadow
				{currentPath === '/focus'
					? 'bg-primary-800 text-white dark:bg-primary-600'
					: 'bg-primary-700 text-white dark:bg-primary-500'}"
			aria-label="Fokus-Modus"
		>
			<Zap size={22} strokeWidth={2.5} />
		</a>

		{#each rightItems as item}
			{@const Icon = item.icon}
			{@const active = currentPath === item.path}
			<a
				href={item.path}
				onclick={triggerVibration}
				class="relative flex min-h-12 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5
					{active ? 'text-primary-600 dark:text-primary-400' : 'text-text-secondary'}
					active:scale-95 transition-transform"
			>
				<Icon size={20} strokeWidth={active ? 2.5 : 2} />
				<span class="w-full truncate text-center text-[10px] font-medium xs:text-xs">{item.name}</span>
				{#if active}
					<span class="absolute bottom-1.5 h-1 w-4 rounded bg-primary-600 dark:bg-primary-400"></span>
				{/if}
			</a>
		{/each}

		<a
			href="/more"
			onclick={triggerVibration}
			class="relative flex min-h-12 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5
				{currentPath === '/more' ? 'text-primary-600 dark:text-primary-400' : 'text-text-secondary'}
				active:scale-95 transition-transform"
		>
			<Settings size={20} strokeWidth={currentPath === '/more' ? 2.5 : 2} />
			<span class="w-full truncate text-center text-[10px] font-medium xs:text-xs">Mehr</span>
			{#if currentPath === '/more'}
				<span class="absolute bottom-1.5 h-1 w-4 rounded bg-primary-600 dark:bg-primary-400"></span>
			{/if}
		</a>
	</div>
</nav>
