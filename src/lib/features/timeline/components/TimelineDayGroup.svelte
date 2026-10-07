<script lang="ts">
	import { APP_LOCALE } from '#lib/core/locale.js';
	import { TIMELINE_MODULES } from '../modules';
	import type { TimelineGroup } from '../types';

	let { group }: { group: TimelineGroup } = $props();
</script>

<div class="space-y-4">
	<div class="relative z-10 flex items-center">
		<span
			class="premium-shadow rounded-xl border border-border-color bg-surface-3 px-3 py-1 text-xs font-extrabold text-text-primary"
		>
			{new Date(group.date).toLocaleDateString(APP_LOCALE, {
				weekday: 'short',
				day: 'numeric',
				month: 'short'
			})}
		</span>
	</div>

	<div class="space-y-4 pl-12">
		{#each group.items as item (item.id)}
			{@const meta = TIMELINE_MODULES.find((m) => m.id === item.module)!}
			{@const Icon = meta.icon}
			<div class="glass-card premium-shadow relative flex items-start gap-4 rounded-2xl p-4">
				<div
					class="absolute top-4 -left-12 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border-color bg-surface-0 text-xs"
				>
					<div class="h-2.5 w-2.5 rounded-full {meta.color.replace('text', 'bg')}"></div>
				</div>

				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {meta.bg} {meta.color}"
				>
					<Icon size={18} />
				</div>

				<div class="min-w-0 flex-1 space-y-1">
					<h4 class="text-sm font-bold text-text-primary">{item.title}</h4>
					{#if item.description}
						<p class="text-xs text-text-secondary">{item.description}</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
