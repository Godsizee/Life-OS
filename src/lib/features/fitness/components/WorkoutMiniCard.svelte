<script lang="ts">
	import { liveWorkoutState } from '$lib/features/fitness/live-workout.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { Dumbbell, Timer } from 'lucide-svelte';

	let tick = $state(0);
	$effect(() => {
		if (!liveWorkoutState.active) return;
		const interval = setInterval(() => (tick += 1), 20000);
		return () => clearInterval(interval);
	});
	const elapsedDisplay = $derived.by(() => {
		tick;
		return liveWorkoutState.elapsedMinutes();
	});

	let restTick = $state(0);
	$effect(() => {
		if (liveWorkoutState.restEndsAt === null) return;
		const interval = setInterval(() => {
			restTick += 1;
		}, 1000);
		return () => clearInterval(interval);
	});
	const restRemaining = $derived.by(() => {
		restTick;
		return liveWorkoutState.restEndsAt !== null ? liveWorkoutState.restRemainingSec() : null;
	});

	const planName = $derived(liveWorkoutState.isFreestyle ? 'Freies Workout' : (fitnessState.plans.find(p => p.id === liveWorkoutState.planId)?.name ?? 'Training'));
	const completedSets = $derived(liveWorkoutState.sets.filter((s) => s.completed).length);
	const totalSets = $derived(liveWorkoutState.sets.length);
</script>

{#if liveWorkoutState.active}
	<a href="/fitness" class="glass-card rounded-2xl p-4 premium-shadow flex items-center justify-between group hover:border-primary-400 dark:hover:border-primary-900 transition-all active:scale-[0.98]">
		<div class="flex items-center gap-3">
			<div class="h-10 w-10 shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
				<Dumbbell size={20} />
			</div>
			<div>
				<h4 class="font-bold text-sm text-text-primary truncate">Workout aktiv: {planName}</h4>
				<div class="flex items-center gap-3 text-[11px] font-semibold text-text-secondary mt-0.5">
					{#if elapsedDisplay !== null}
						<span>{elapsedDisplay} Min.</span>
					{/if}
					{#if totalSets > 0}
						<span>{completedSets}/{totalSets} Sätze</span>
					{/if}
					{#if restRemaining !== null && restRemaining > 0}
						<span class="flex items-center gap-1 text-primary-active">
							<Timer size={11} />
							<span>Pause {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, '0')}</span>
						</span>
					{/if}
				</div>
			</div>
		</div>
	</a>
{/if}
