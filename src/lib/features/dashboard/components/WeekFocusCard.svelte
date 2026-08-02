<script lang="ts">
	// W10 — macht die im Weekly Review gewählten Top-3 sichtbar und abhakbar,
	// statt sie im Tagebuch versanden zu lassen.
	import { Check, Star } from 'lucide-svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { toastState } from '$lib/core/toast.svelte';

	const focusTasks = $derived(tasksState.focusTasks);
</script>

{#if focusTasks.length > 0}
	<section class="space-y-2">
		<h2 class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-tertiary">
			<Star size={12} class="fill-amber-400 text-amber-400" /> Wochenfokus
		</h2>
		<div class="flex flex-col gap-2 rounded-2xl border border-primary-active/20 bg-primary-active-bg/50 p-4 premium-shadow">
			{#each focusTasks as task (task.id)}
				{@const isDone = task.status === 'done'}
				<div class="flex items-center">
					<!-- Der sichtbare Kreis bleibt 24px, das Antippfeld misst aber die
					     geforderten 48px (negative Margins halten die Optik unveraendert). -->
					<button
						onclick={async () => {
							await tasksState.setStatus(task.id, isDone ? 'todo' : 'done');
							await analyticsState.saveTodayScore();
							if (!isDone) toastState.success(`"${task.title}" erledigt ✓`);
						}}
						class="-my-3 -ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
						aria-label={isDone ? 'Als offen markieren' : 'Erledigt'}
					>
						<span
							class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all
								{isDone ? 'border-primary-active bg-primary-active text-white' : 'border-primary-active bg-surface-0 text-primary-active'}"
						>
							{#if isDone}<Check size={12} strokeWidth={2.5} />{/if}
						</span>
					</button>
					<p class="min-w-0 flex-1 truncate text-sm font-medium {isDone ? 'text-text-tertiary line-through' : 'text-text-primary'}">
						{task.title}
					</p>
				</div>
			{/each}
		</div>
	</section>
{/if}
