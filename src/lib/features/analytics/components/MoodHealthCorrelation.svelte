<script lang="ts">
	import { moodState } from '$lib/features/mood/store.svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { toISODate } from '$lib/core/date';

	/**
	 * Berechnet den Pearson-Korrelationskoeffizient zwischen zwei gleich langen Arrays.
	 * Gibt null zurück wenn zu wenig Datenpunkte vorhanden (< 3).
	 */
	function pearson(xs: number[], ys: number[]): number | null {
		const n = xs.length;
		if (n < 3) return null;
		const mx = xs.reduce((a, b) => a + b, 0) / n;
		const my = ys.reduce((a, b) => a + b, 0) / n;
		const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
		const den = Math.sqrt(
			xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
			ys.reduce((s, y) => s + (y - my) ** 2, 0)
		);
		if (den === 0) return null;
		return num / den;
	}

	/** Letzte 30 Tage als ISO-Date-Strings */
	function last30Days(): string[] {
		return Array.from({ length: 30 }, (_, i) => {
			const d = new Date();
			d.setDate(d.getDate() - (29 - i));
			return toISODate(d);
		});
	}

	interface CorrelationPoint {
		date: string;
		mood: 1 | 2 | 3 | 4 | 5;
		sleep: number | null;
		energy: 1 | 2 | 3 | 4 | 5 | null;
		water: number | null;
	}

	const points = $derived((): CorrelationPoint[] => {
		return last30Days()
			.map((date) => {
				const mood = moodState.entries.find((e) => e.date === date);
				const health = healthState.entries.find((e) => e.date === date);
				if (!mood) return null;
				return {
					date,
					mood: mood.score,
					sleep: health?.sleep_h ?? null,
					energy: health?.energy ?? null,
					water: health?.water_glasses ?? null
				};
			})
			.filter((p): p is CorrelationPoint => p !== null);
	});

	const correlations = $derived((): { label: string; r: number | null; color: string; hint: string }[] => {
		const ps = points();
		const moodVals = ps.map((p) => p.mood);

		const sleepPts = ps.filter((p) => p.sleep !== null);
		const energyPts = ps.filter((p) => p.energy !== null);
		const waterPts = ps.filter((p) => p.water !== null);

		const rSleep = pearson(sleepPts.map((p) => p.sleep!), sleepPts.map((p) => p.mood));
		const rEnergy = pearson(energyPts.map((p) => p.energy!), energyPts.map((p) => p.mood));
		const rWater = pearson(waterPts.map((p) => p.water!), waterPts.map((p) => p.mood));

		function color(r: number | null) {
			if (r === null) return 'text-text-tertiary';
			if (r >= 0.4) return 'text-emerald-500';
			if (r <= -0.4) return 'text-red-500';
			return 'text-amber-500';
		}

		function hint(label: string, r: number | null): string {
			if (r === null) return 'Zu wenig Daten (mind. 3 Tage)';
			if (r >= 0.6) return `Mehr ${label} → deutlich bessere Stimmung`;
			if (r >= 0.3) return `Mehr ${label} → tendenziell besser Stimmung`;
			if (r <= -0.6) return `Mehr ${label} → tendenziell schlechtere Stimmung`;
			if (r <= -0.3) return `Mehr ${label} → leicht schlechtere Stimmung`;
			return `Kein klarer Zusammenhang`;
		}

		return [
			{ label: 'Schlaf', r: rSleep, color: color(rSleep), hint: hint('Schlaf', rSleep) },
			{ label: 'Energie', r: rEnergy, color: color(rEnergy), hint: hint('Energie', rEnergy) },
			{ label: 'Wasser', r: rWater, color: color(rWater), hint: hint('Wasser', rWater) }
		];
	});

	const hasData = $derived(points().length >= 3);
</script>

<section class="space-y-3">
	<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Stimmung ↔ Gesundheit</h2>

	{#if !hasData}
		<div class="glass-card rounded-2xl p-5 premium-shadow flex items-center gap-3 text-sm text-text-secondary">
			<span class="text-2xl">🔬</span>
			<span>Logg mindestens 3 Tage Stimmung + Gesundheit, um Korrelationen zu sehen.</span>
		</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-3">
			{#each correlations() as corr}
				<div class="glass-card rounded-2xl p-4 premium-shadow flex flex-col gap-1">
					<span class="text-xs font-bold uppercase tracking-wider text-text-tertiary">{corr.label}</span>
					<span class="text-2xl font-extrabold tabular-nums {corr.color}">
						{corr.r !== null ? (corr.r >= 0 ? '+' : '') + corr.r.toFixed(2) : '—'}
					</span>
					<span class="text-xs text-text-secondary leading-snug">{corr.hint}</span>
				</div>
			{/each}
		</div>
		<p class="text-[11px] text-text-tertiary px-1">
			Pearson-Korrelation über {points().length} Tage. Bereich: −1 (negativ) bis +1 (positiv).
		</p>
	{/if}
</section>
