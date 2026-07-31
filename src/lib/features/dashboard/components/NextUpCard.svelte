<script lang="ts">
	import { Check } from 'lucide-svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { toastState } from '$lib/core/toast.svelte';
	import { formatShortDate } from '$lib/core/date';
	import { rankTasks } from '$lib/features/dashboard/scoring';

	const nextTask = $derived(rankTasks(tasksState.tasks)[0] ?? null);
</script>

{#if nextTask}
	<section class="space-y-2">
		<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Was jetzt?</h2>
		<div class="rounded-2xl border border-primary-active/20 bg-primary-active-bg/50 p-4 premium-shadow">
			<div class="flex items-start gap-4">
				<button
					onclick={async () => {
						await tasksState.setStatus(nextTask.id, 'done');
						await analyticsState.saveTodayScore();
						toastState.success(`"${nextTask.title}" erledigt ✓`);
					}}
					class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary-active bg-surface-0 text-primary-active transition-all hover:bg-primary-active-bg active:scale-90"
					aria-label="Erledigt"
				>
					<Check size={12} strokeWidth={2.5} />
				</button>
				
				<div class="min-w-0 flex-1">
					<p class="font-bold text-text-primary leading-snug">{nextTask.title}</p>
					{#if nextTask.due_at}
						<p class="mt-1 text-xs text-text-tertiary">
							Fällig: {formatShortDate(nextTask.due_at)}
						</p>
					{/if}
					{#if nextTask.goal_id}
						{@const linkedGoal = goalsState.goals.find(g => g.id === nextTask.goal_id)}
						{#if linkedGoal}
							<p class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-active">
								<span>🎯</span> <span>{linkedGoal.title}</span>
							</p>
						{/if}
					{/if}
				</div>
				
				<a href="/tasks" class="shrink-0 text-xs font-semibold text-primary-active hover:underline">Alle</a>
			</div>
		</div>
	</section>
{/if}
