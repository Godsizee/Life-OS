<script lang="ts">
	import { Droplet, Moon } from 'lucide-svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { toastState } from '$lib/core/toast.svelte';
	import { haptic } from '$lib/core/haptics';
	import { waterMl, goalPercent } from '$lib/features/health/stats';
	import { formatWater } from '$lib/features/profile/units';

	const waterValMl = $derived(healthState.todayEntry ? waterMl(healthState.todayEntry) ?? 0 : 0);
	const targetMl = $derived(profileState.waterGoalMl);
	const waterPct = $derived(goalPercent(waterValMl, targetMl));

	async function trinken(deltaMl: number) {
		await healthState.addWater(deltaMl);
		await analyticsState.saveTodayScore();
		haptic(10);
		toastState.success(deltaMl > 0 ? 'Wasser geloggt' : 'Zurückgenommen');
	}
	
	const sleepH = $derived(healthState.todayEntry?.sleep_h ?? 0);
	const targetSleepH = $derived(profileState.sleepGoalH);
</script>

<div class="grid grid-cols-2 gap-3">
	<!-- Water intake -->
	<div class="flex flex-col items-center gap-2 rounded-xl border border-border-color bg-surface-2 p-3 text-center min-h-[96px] justify-between">
		<div class="flex flex-col items-center">
			<Droplet class="text-blue-500 mb-1" size={20} />
			<span class="text-xs font-bold text-text-primary">Wasser</span>
		</div>
		
		<div class="flex w-full items-center gap-2 mt-1">
			<button
				onclick={() => trinken(-profileState.glassSizeMl)}
				disabled={waterValMl === 0}
				aria-label="Ein Glas zurücknehmen"
				class="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border-color text-text-primary disabled:opacity-30 active:scale-95"
			>−</button>
	
			<div class="min-w-0 flex-1">
				<div class="h-1.5 overflow-hidden rounded-full bg-surface-3">
					<div class="h-full bg-blue-500 transition-all" style="width: {waterPct}%"></div>
				</div>
				<p class="mt-1 text-center text-[9px] text-text-tertiary">
					{formatWater(waterValMl, profileState.waterUnit, profileState.glassSizeMl)}
					/ {formatWater(targetMl, profileState.waterUnit, profileState.glassSizeMl)}
				</p>
			</div>
	
			<button
				onclick={() => trinken(profileState.glassSizeMl)}
				aria-label="Ein Glas hinzufügen"
				class="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-600 text-white active:scale-95"
			>+</button>
		</div>
	</div>

	<!-- Sleep time info -->
	<a href="/health" class="flex flex-col items-center gap-2 p-3 rounded-xl border border-border-color bg-surface-2 text-center hover:bg-surface-3 active:scale-95 transition-all min-h-[96px] justify-center">
		<Moon class="text-purple-500 mb-1" size={20} />
		<span class="text-xs font-bold text-text-primary">Schlaf</span>
		<span class="text-[10px] text-text-tertiary mt-0.5">{sleepH} / {targetSleepH} h</span>
	</a>
</div>
