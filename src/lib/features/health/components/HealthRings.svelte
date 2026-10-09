<script lang="ts">
	// W9 — Tagesfortschritt gegen die Ziele aus profiles.settings.
	import { Droplet, Moon, Scale, Zap } from '@lucide/svelte';
	import WarumSticker from '#lib/ui/WarumSticker.svelte';
	import { ringeErklaerung } from '../erklaerung';
	import MetricRing from './MetricRing.svelte';
	import { healthState } from '../store.svelte';
	import { profileState } from '#lib/features/profile/store.svelte.js';
	import {
		formatMetric,
		goalPercent,
		num,
		weightToGoal,
		waterMl,
		weightTrend,
		weightGoalPercent
	} from '../stats';

	const entry = $derived(healthState.todayEntry);

	const waterMlValue = $derived(entry ? waterMl(entry) : null);
	const sleep = $derived(num(entry?.sleep_h ?? null));
	const weight = $derived(num(entry?.weight_kg ?? null));
	const energy = $derived(num(entry?.energy ?? null));

	const sleepGoal = $derived(profileState.sleepGoalH);
	const weightGoal = $derived(profileState.weightGoalKg);
	const toGoal = $derived(weightToGoal(weight, weightGoal));

	const weightTrendData = $derived(weightTrend(healthState.entries, 400));
	const startWeight = $derived(weightTrendData?.first ?? null);
	const weightPct = $derived(weightGoalPercent(startWeight, weight, weightGoal) ?? 0);
	const weightFormatted = $derived(
		formatMetric('weight_kg', weight, { weightUnit: profileState.weightUnit })
	);
	const weightGoalFormatted = $derived(
		formatMetric('weight_kg', weightGoal, { weightUnit: profileState.weightUnit })
	);
	const waterFormatted = $derived(
		formatMetric('water_ml', waterMlValue, {
			waterUnit: profileState.waterUnit,
			glassSizeMl: profileState.glassSizeMl
		})
	);
	const warum = $derived(
		ringeErklaerung({
			wasserZiel:
				profileState.waterUnit === 'ml'
					? `${profileState.waterGoalMl} ml`
					: `${profileState.waterGoalGlasses} Gläser`,
			schlafZielH: sleepGoal,
			gewichtZiel: weightGoal === null ? null : weightGoalFormatted,
			gewichtStart:
				startWeight === null
					? null
					: formatMetric('weight_kg', startWeight, { weightUnit: profileState.weightUnit })
		})
	);
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
	<MetricRing
		percent={goalPercent(waterMlValue, profileState.waterGoalMl)}
		label="Wasser"
		value={waterFormatted}
		goalLabel="Ziel {profileState.waterUnit === 'ml'
			? `${profileState.waterGoalMl} ml`
			: `${profileState.waterGoalGlasses} Gläser`}"
		icon={Droplet}
	/>
	<MetricRing
		percent={goalPercent(sleep, sleepGoal)}
		label="Schlaf"
		value={formatMetric('sleep_h', sleep)}
		goalLabel="Ziel {sleepGoal} h"
		icon={Moon}
	/>
	<MetricRing
		percent={energy === null ? 0 : (energy / 5) * 100}
		label="Energie"
		value={energy === null ? '—' : `${Math.round(energy)}/5`}
		icon={Zap}
	/>
	<MetricRing
		percent={weightPct}
		label="Gewicht"
		value={weightFormatted}
		goalLabel={weightGoal === null
			? 'kein Ziel'
			: toGoal === null
				? `Ziel ${weightGoalFormatted}`
				: toGoal > 0
					? `noch ${toGoal} ${profileState.weightUnit}`
					: 'Ziel erreicht'}
		icon={Scale}
	/>
</div>
<div class="mt-3">
	<WarumSticker kontext="Ringe" zeigeKontext erklaerung={warum} />
</div>
