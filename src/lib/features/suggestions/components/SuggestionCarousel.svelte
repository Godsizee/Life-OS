<script lang="ts">
	import { getSuggestions, type Suggestion } from '../engine';
	import { goto } from '$app/navigation';
	import { Sparkles, ArrowRight, Check } from 'lucide-svelte';

	let suggestions = $derived(getSuggestions());

	let processingId = $state<string | null>(null);

	async function handleAction(item: Suggestion) {
		if (item.onClick) {
			processingId = item.id;
			try {
				await item.onClick();
			} finally {
				processingId = null;
			}
		} else if (item.actionRoute) {
			await goto(item.actionRoute);
		}
	}
</script>

<div class="w-full space-y-3">
	<!-- Section Header -->
	<div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
		<Sparkles size={14} class="text-primary-600 dark:text-primary-400" />
		<span>Fokus-Vorschläge</span>
	</div>

	<!-- Carousel Container -->
	<div class="flex w-full min-w-0 gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
		{#each suggestions as item (item.id)}
			<div class="glass-card snap-start flex w-full shrink-0 flex-col justify-between rounded-2xl p-5 premium-shadow transition-all md:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)]">
				<div class="flex items-start gap-4">
					<!-- Icon Shield -->
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl">
						{item.icon}
					</div>
					
					<!-- Content -->
					<div class="space-y-1 min-w-0">
						<h4 class="truncate text-sm font-bold text-text-primary">{item.title}</h4>
						<p class="text-xs leading-relaxed text-text-secondary line-clamp-2">{item.description}</p>
					</div>
				</div>

				<!-- Action Footer -->
				{#if item.actionText}
					<div class="mt-4 flex justify-end">
						<button
							onclick={() => handleAction(item)}
							disabled={processingId === item.id}
							class="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white active:scale-95 transition-all disabled:opacity-50"
						>
							{#if processingId === item.id}
								<span class="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
							{:else if item.onClick}
								<Check size={12} strokeWidth={3} />
							{:else}
								<ArrowRight size={12} strokeWidth={3} />
							{/if}
							<span>{item.actionText}</span>
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex w-full items-center justify-center rounded-2xl border border-dashed border-border-color py-8">
				<span class="text-xs text-text-tertiary">Keine Vorschläge verfügbar</span>
			</div>
		{/each}
	</div>
</div>
