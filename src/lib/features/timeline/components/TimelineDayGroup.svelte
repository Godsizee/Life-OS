<script lang="ts">
	import { APP_LOCALE } from '$lib/core/locale';
	import { TIMELINE_MODULES } from '../modules';
	import type { TimelineGroup } from '../types';

	let { group }: { group: TimelineGroup } = $props();
</script>

<div class="space-y-4">
	<div class="relative z-10 flex items-center">
		<span class="rounded-xl bg-surface-3 px-3 py-1 text-xs font-extrabold text-text-primary border border-border-color premium-shadow">
			{new Date(group.date).toLocaleDateString(APP_LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })}
		</span>
	</div>

	<div class="pl-12 space-y-4">
		{#each group.items as item (item.id)}
			{@const meta = TIMELINE_MODULES.find((m) => m.id === item.module)!}
			{@const Icon = meta.icon}
			<div class="glass-card relative flex items-start gap-4 rounded-2xl p-4 premium-shadow">
				<div class="absolute -left-12 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-surface-0 border-2 border-border-color text-xs">
					<div class="h-2.5 w-2.5 rounded-full {meta.color.replace('text', 'bg')}"></div>
				</div>

				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {meta.bg} {meta.color}">
					<Icon size={18} />
				</div>

				<div class="space-y-1 min-w-0 flex-1">
					<h4 class="text-sm font-bold text-text-primary">{item.title}</h4>
					{#if item.description}
						<p class="text-xs text-text-secondary">{item.description}</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
