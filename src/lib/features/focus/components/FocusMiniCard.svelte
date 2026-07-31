<script lang="ts">
	import { focusSession } from '../session.svelte';
	import { phaseLabel } from '../session-logic';
	import { Pause, Play, Zap } from 'lucide-svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';

	// Sekunden-Tick nur, solange die Karte sichtbar UND die Session aktiv ist.
	let tick = $state(0);
	$effect(() => {
		if (!focusSession.running) return;
		const i = setInterval(() => (tick += 1), 1000);
		return () => clearInterval(i);
	});
	const clock = $derived.by(() => { tick; return focusSession.clock(); });
	const task = $derived(
		focusSession.taskId ? tasksState.tasks.find((t) => t.id === focusSession.taskId) : null
	);
</script>

{#if focusSession.active}
	<a href="/focus"
	   class="flex items-center gap-3 rounded-2xl border border-primary-active/20 bg-primary-active-bg p-4 premium-shadow mb-4">
		<Zap size={18} class="shrink-0 text-primary-active animate-pulse" />
		<div class="min-w-0 flex-1">
			<p class="text-sm font-bold text-primary-active">
				{phaseLabel(focusSession.phase)} läuft — {clock}
			</p>
			{#if task}
				<p class="truncate text-xs text-text-secondary mt-0.5">{task.title}</p>
			{/if}
		</div>
		<button
			onclick={(e) => { e.preventDefault(); focusSession.toggle(focusSession.taskId ?? ''); }}
			aria-label={focusSession.paused ? 'Fortsetzen' : 'Pausieren'}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-0 premium-shadow"
		>
			{#if focusSession.paused}<Play size={16} class="ml-0.5" />{:else}<Pause size={16} />{/if}
		</button>
	</a>
{/if}
