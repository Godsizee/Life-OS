<script lang="ts">
	// Welle F3 — Wochen-Volumen pro Muskelgruppe als Balken (gleiches Fortschrittsbalken-Muster
	// wie die Ziel-Fortschrittsanzeige in routes/goals/[id]/+page.svelte).
	import type { MuscleGroupVolume } from '../utils/volume';

	let { data }: { data: MuscleGroupVolume[] } = $props();
	const max = $derived(Math.max(...data.map((d) => d.volumeKg), 1));
</script>

{#if data.length === 0}
	<p class="text-xs text-text-tertiary">
		Noch kein Kraft-Volumen diese Woche (nur Übungen aus dem Katalog zählen für die Muskelgruppe).
	</p>
{:else}
	<div class="space-y-3">
		{#each data as d (d.muscleGroup)}
			<div class="space-y-1">
				<div class="flex items-center justify-between text-xs">
					<span class="font-semibold text-text-primary">{d.muscleGroup}</span>
					<span class="text-text-tertiary tabular-nums">{d.volumeKg.toLocaleString('de-DE')} kg</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-surface-2 border border-border-color/20">
					<div
						class="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-500"
						style="width: {(d.volumeKg / max) * 100}%"
					></div>
				</div>
			</div>
		{/each}
	</div>
{/if}
