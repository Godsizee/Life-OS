<script lang="ts">
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { Calendar, ChevronRight, Clock, Edit3, Zap, Repeat, Save } from 'lucide-svelte';

	interface Props {
		onRepeat: (logId: string) => void;
		onSaveAsPlan: (logId: string) => void;
	}

	let { onRepeat, onSaveAsPlan }: Props = $props();
</script>

<div class="grid gap-4 lg:grid-cols-2 lg:items-start">
	{#each fitnessState.logs as log (log.id)}
		{@const planName = fitnessState.plans.find((p) => p.id === log.plan_id)?.name ?? 'Freies Training'}
		<div class="glass-card flex flex-col rounded-2xl p-5 premium-shadow space-y-3 hover:border-primary-400 dark:hover:border-primary-900 transition-all">
			<a
				href="/fitness/log/{log.id}"
				class="block space-y-3 active:scale-[0.99] flex-1"
			>
				<div class="flex items-center justify-between">
					<h4 class="font-bold text-sm text-text-primary flex items-center gap-2">
						{#if !fitnessState.plans.find((p) => p.id === log.plan_id)}
							<Zap size={13} class="text-primary-active shrink-0" />
						{/if}
						{planName}
					</h4>
					<span class="flex items-center gap-1 text-xs text-text-tertiary font-medium">
						<Calendar size={12} />
						<span>{new Date(log.date).toLocaleDateString('de-DE')}</span>
						<ChevronRight size={14} class="text-text-tertiary" />
					</span>
				</div>

				<div class="flex gap-4 text-xs font-semibold text-text-secondary border-b border-border-color pb-2">
					{#if log.duration_minutes}
						<span class="flex items-center gap-1">
							<Clock size={12} />
							<span>{log.duration_minutes} Min.</span>
						</span>
					{/if}
					{#if log.notes}
						<span class="flex items-center gap-1">
							<Edit3 size={12} />
							<span class="truncate">"{log.notes}"</span>
						</span>
					{/if}
				</div>
			</a>
			<div class="flex justify-end gap-2 pt-1">
				<button 
					onclick={() => onSaveAsPlan(log.id)}
					class="min-h-9 px-3 rounded-lg bg-surface-2 hover:bg-primary-500/10 hover:text-primary-active text-text-secondary font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
				>
					<Save size={14} />
					<span>Als Plan</span>
				</button>
				<button 
					onclick={() => onRepeat(log.id)}
					class="min-h-9 px-3 rounded-lg bg-surface-2 hover:bg-primary-500/10 hover:text-primary-active text-text-secondary font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
				>
					<Repeat size={14} />
					<span>Wiederholen</span>
				</button>
			</div>
		</div>
	{:else}
		<div class="text-center py-12 text-text-tertiary lg:col-span-2 text-sm border border-dashed border-border-color rounded-2xl">
			Keine aufgezeichneten Workouts vorhanden.
		</div>
	{/each}
</div>
