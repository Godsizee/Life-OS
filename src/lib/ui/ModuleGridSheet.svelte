<script lang="ts">
	import { Settings } from 'lucide-svelte';
	import { modules } from '$lib/config/modules';
	import { haptic } from '$lib/core/haptics';
	import Sheet from './Sheet.svelte';

	let {
		open = $bindable(false),
		currentPath = '/'
	}: { open?: boolean; currentPath?: string } = $props();

	function go() {
		haptic(10);
		open = false;
	}
</script>

<Sheet bind:open title="Alle Module">
	<nav class="px-3 pb-4">
		<!-- 4 Spalten ab 360px, darunter 3 – auf 320px waeren 4 Kacheln zu schmal
		     fuer Icon plus lesbares Label. -->
		<ul class="grid grid-cols-3 gap-1 xs:grid-cols-4">
			{#each modules as module (module.id)}
				{@const Icon = module.icon}
				{@const active = currentPath === module.route}
				<li>
					<a
						href={module.route}
						onclick={go}
						aria-current={active ? 'page' : undefined}
						class="flex min-h-20 min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2 transition-transform active:scale-95
							{active ? 'bg-primary-active-bg text-primary-active' : 'text-text-secondary hover:bg-surface-2'}"
					>
						<Icon size={22} strokeWidth={active ? 2.5 : 2} />
						<span class="w-full truncate text-center text-[11px] font-medium">{module.label}</span>
					</a>
				</li>
			{/each}
		</ul>

		<div class="mt-2 border-t border-border-color pt-2">
			<a
				href="/more"
				onclick={go}
				class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-transform active:scale-95
					{currentPath === '/more'
					? 'bg-primary-active-bg text-primary-active'
					: 'text-text-secondary hover:bg-surface-2'}"
			>
				<Settings size={20} strokeWidth={2} />
				Einstellungen
			</a>
		</div>
	</nav>
</Sheet>
