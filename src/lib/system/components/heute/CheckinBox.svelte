<script lang="ts">
	import { istAktiv } from '../../module-aktiv.svelte.js';
	import { healthState } from '#lib/features/health/store.svelte.js';
	import { formatMetric, waterMl } from '#lib/features/health/stats.js';
	import { moodState } from '#lib/features/mood/store.svelte.js';
	import { MOOD_LABELS } from '#lib/features/mood/types.js';
	import { profileState } from '#lib/features/profile/store.svelte.js';
	import Aufklapper from '#lib/ui/Aufklapper.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Chip from '#lib/ui/Chip.svelte';

	const stimmung = $derived(moodState.todayEntry?.score ?? null);
	const wasserHeute = $derived(
		formatMetric('water_ml', healthState.todayEntry ? waterMl(healthState.todayEntry) : null, {
			waterUnit: profileState.waterUnit,
			glassSizeMl: profileState.glassSizeMl
		})
	);
</script>

{#if istAktiv('mood') || istAktiv('health')}
	<Aufklapper titel="Check-in">
		<div class="flex flex-col gap-4">
			{#if istAktiv('mood')}
				<div class="flex flex-col gap-2" role="group" aria-labelledby="checkin-stimmung">
					<p id="checkin-stimmung" class="mono-label">Stimmung</p>
					<div class="flex flex-wrap gap-2">
						{#each [1, 2, 3, 4, 5] as score (score)}
							<Chip selected={stimmung === score} onclick={() => moodState.save(score, null)}>
								{MOOD_LABELS[score]}
							</Chip>
						{/each}
					</div>
				</div>
			{/if}
			{#if istAktiv('health')}
				<div class="flex flex-col gap-2">
					<p class="mono-label">Wasser heute</p>
					<div class="flex flex-wrap items-center gap-3">
						<Button
							variant="sekundaer"
							onclick={() => healthState.addWater(profileState.glassSizeMl)}
						>
							+ 1 Glas
						</Button>
						<span class="mono-label tabular-nums">{wasserHeute}</span>
					</div>
				</div>
			{/if}
		</div>
	</Aufklapper>
{/if}
