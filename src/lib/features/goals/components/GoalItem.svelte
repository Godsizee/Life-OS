<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { Goal, GoalStatus } from '../types';
	import { goalsState } from '../store.svelte';

	let { goal }: { goal: Goal } = $props();

	const statusLabel: Record<GoalStatus, string> = {
		open: 'Offen',
		in_progress: 'In Arbeit',
		done: 'Erledigt'
	};
</script>

<li class="rounded-xl border border-slate-200 bg-white p-3">
	<div class="flex items-start justify-between gap-2">
		<p class="min-w-0 flex-1 truncate font-medium text-slate-900">{goal.title}</p>
		<button
			onclick={() => goalsState.removeGoal(goal.id)}
			aria-label="Löschen"
			class="shrink-0 text-slate-400 active:text-red-600"
		>
			<Trash2 size={18} />
		</button>
	</div>
	<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
		<div class="h-full bg-emerald-600" style="width: {goal.progress}%"></div>
	</div>
	<div class="mt-2 flex items-center justify-between gap-2">
		<input
			type="range"
			min="0"
			max="100"
			step="10"
			value={goal.progress}
			onchange={(e) => goalsState.updateProgress(goal.id, Number(e.currentTarget.value))}
			class="h-8 flex-1"
			aria-label="Fortschritt"
		/>
		<select
			value={goal.status}
			onchange={(e) => goalsState.setStatus(goal.id, e.currentTarget.value as GoalStatus)}
			class="min-h-12 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
		>
			{#each Object.entries(statusLabel) as [value, label] (value)}
				<option {value}>{label}</option>
			{/each}
		</select>
	</div>
</li>
