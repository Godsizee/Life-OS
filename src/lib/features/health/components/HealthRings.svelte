<script lang="ts">
	// W9 — Tagesfortschritt gegen die Ziele aus profiles.settings.
	import { Droplet, Moon, Scale, Zap } from 'lucide-svelte';
	import MetricRing from './MetricRing.svelte';
	import { healthState } from '../store.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import { formatMetric, goalPercent, num, weightToGoal } from '../stats';

	const entry = $derived(healthState.todayEntry);

	const water = $derived(num(entry?.water_glasses ?? null));
	const sleep = $derived(num(entry?.sleep_h ?? null));
	const weight = $derived(num(entry?.weight_kg ?? null));
	const energy = $derived(num(entry?.energy ?? null));

	const waterGoal = $derived(profileState.waterGoalGlasses);
	const sleepGoal = $derived(profileState.sleepGoalH);
	const weightGoal = $derived(profileState.weightGoalKg);
	const toGoal = $derived(weightToGoal(weight, weightGoal));
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
	<MetricRing
		percent={goalPercent(water, waterGoal)}
		label="Wasser"
		value={water === null ? '—' : String(Math.round(water))}
		goalLabel="Ziel {waterGoal}"
		icon={Droplet}
		colorClass="stroke-blue-500"
	/>
	<MetricRing
		percent={goalPercent(sleep, sleepGoal)}
		label="Schlaf"
		value={formatMetric('sleep_h', sleep)}
		goalLabel="Ziel {sleepGoal} h"
		icon={Moon}
		colorClass="stroke-purple-500"
	/>
	<MetricRing
		percent={energy === null ? 0 : (energy / 5) * 100}
		label="Energie"
		value={energy === null ? '—' : `${Math.round(energy)}/5`}
		icon={Zap}
		colorClass="stroke-amber-500"
	/>
	<MetricRing
		percent={weight === null || weightGoal === null ? 0 : 100}
		label="Gewicht"
		value={formatMetric('weight_kg', weight)}
		goalLabel={weightGoal === null
			? 'kein Ziel'
			: toGoal === null
				? `Ziel ${weightGoal} kg`
				: toGoal > 0
					? `noch ${toGoal} kg`
					: 'Ziel erreicht'}
		icon={Scale}
		colorClass="stroke-cyan-500"
	/>
</div>
