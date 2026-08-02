<script lang="ts">
	import { liveWorkoutState } from '$lib/features/fitness/live-workout.svelte';
	import { Timer } from 'lucide-svelte';

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
</script>

{#if restRemaining !== null}
	<div class="glass-card rounded-xl p-3 premium-shadow flex items-center justify-between gap-2">
		<span class="flex items-center gap-2 text-sm font-bold text-text-primary">
			<Timer size={15} class="text-primary-active" />
			<span>Pause: {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, '0')}</span>
		</span>
		<div class="flex items-center gap-1">
			<button
				onclick={() => liveWorkoutState.adjustRest(-15)}
				class="min-h-9 rounded-lg border border-border-color px-2 text-xs font-bold text-text-secondary active:bg-surface-2"
			>
				−15s
			</button>
			<button
				onclick={() => liveWorkoutState.adjustRest(15)}
				class="min-h-9 rounded-lg border border-border-color px-2 text-xs font-bold text-text-secondary active:bg-surface-2"
			>
				+15s
			</button>
			<button onclick={() => liveWorkoutState.stopRest()} class="min-h-9 px-2 text-xs font-semibold text-text-tertiary hover:text-text-primary">Überspringen</button>
		</div>
	</div>
{/if}
