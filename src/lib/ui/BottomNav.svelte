<script lang="ts">
	import { Settings } from 'lucide-svelte';
	import { modules } from '$lib/config/modules';

	let { currentPath = '/' }: { currentPath?: string } = $props();

	const navModuleIds = ['dashboard', 'tasks', 'notes', 'calendar'];
	const items = [
		...modules
			.filter((m) => navModuleIds.includes(m.id))
			.map((m) => ({ name: m.label, path: m.route, icon: m.icon })),
		{ name: 'Mehr', path: '/more', icon: Settings }
	];
</script>

<nav
	class="fixed bottom-0 w-full border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
>
	<div class="flex h-16 items-center justify-around px-2 xs:px-4">
		{#each items as item}
			{@const Icon = item.icon}
			<a
				href={item.path}
				class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 xs:px-3 {currentPath ===
				item.path
					? 'text-emerald-600'
					: 'text-slate-500'} active:scale-95 transition-transform"
			>
				<Icon size={20} strokeWidth={currentPath === item.path ? 2.5 : 2} />
				<span class="text-[10px] font-medium xs:text-xs">{item.name}</span>
			</a>
		{/each}
	</div>
</nav>
