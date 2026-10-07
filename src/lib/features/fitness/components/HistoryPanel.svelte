<script lang="ts">
	import { fitnessState } from '#lib/features/fitness/store.svelte.js';
	import { Calendar, ChevronRight, Clock, Edit3, Zap, Repeat, Save } from '@lucide/svelte';

	interface Props {
		onRepeat: (logId: string) => void;
		onSaveAsPlan: (logId: string) => void;
	}

	let { onRepeat, onSaveAsPlan }: Props = $props();
</script>

<div class="grid gap-4 lg:grid-cols-2 lg:items-start">
	{#each fitnessState.logs as log (log.id)}
		{@const planName =
			fitnessState.plans.find((p) => p.id === log.plan_id)?.name ?? 'Freies Training'}
		<div
			class="glass-card premium-shadow flex flex-col space-y-3 rounded-2xl p-5 transition-all hover:border-primary-400 dark:hover:border-primary-900"
		>
			<a href="/fitness/log/{log.id}" class="block flex-1 space-y-3 active:scale-[0.99]">
				<div class="flex items-center justify-between">
					<h4 class="flex items-center gap-2 text-sm font-bold text-text-primary">
						{#if !fitnessState.plans.find((p) => p.id === log.plan_id)}
							<Zap size={13} class="shrink-0 text-primary-active" />
						{/if}
						{planName}
					</h4>
					<span class="flex items-center gap-1 text-xs font-medium text-text-tertiary">
						<Calendar size={12} />
						<span>{new Date(log.date).toLocaleDateString('de-DE')}</span>
						<ChevronRight size={14} class="text-text-tertiary" />
					</span>
				</div>

				<div
					class="flex gap-4 border-b border-border-color pb-2 text-xs font-semibold text-text-secondary"
				>
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
					class="flex min-h-9 items-center gap-1.5 rounded-lg bg-surface-2 px-3 text-xs font-bold text-text-secondary transition-all hover:bg-primary-500/10 hover:text-primary-active active:scale-95"
				>
					<Save size={14} />
					<span>Als Plan</span>
				</button>
				<button
					onclick={() => onRepeat(log.id)}
					class="flex min-h-9 items-center gap-1.5 rounded-lg bg-surface-2 px-3 text-xs font-bold text-text-secondary transition-all hover:bg-primary-500/10 hover:text-primary-active active:scale-95"
				>
					<Repeat size={14} />
					<span>Wiederholen</span>
				</button>
			</div>
		</div>
	{:else}
		<div
			class="rounded-2xl border border-dashed border-border-color py-12 text-center text-sm text-text-tertiary lg:col-span-2"
		>
			Keine aufgezeichneten Workouts vorhanden.
		</div>
	{/each}
</div>
