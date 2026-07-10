<script lang="ts">
	import { healthState } from '../store.svelte';

	let weight = $state('');
	let sleep = $state('');
	let water = $state(0);
	let energy = $state<number | null>(null);
	let saving = $state(false);

	$effect(() => {
		const e = healthState.todayEntry;
		if (e) {
			weight = e.weight_kg != null ? String(e.weight_kg) : '';
			sleep = e.sleep_h != null ? String(e.sleep_h) : '';
			water = e.water_glasses ?? 0;
			energy = e.energy ?? null;
		}
	});

	async function save() {
		saving = true;
		try {
			await healthState.save({
				weight_kg: weight ? parseFloat(weight) : null,
				sleep_h: sleep ? parseFloat(sleep) : null,
				water_glasses: water || null,
				energy
			});
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Energie -->
	<div>
		<div class="mb-1.5 block text-sm font-medium text-text-primary">⚡ Energie</div>
		<div class="flex gap-2">
			{#each [1, 2, 3, 4, 5] as e}
				<button
					type="button"
					onclick={() => (energy = e)}
					class="flex h-10 flex-1 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all active:scale-95
						{energy === e ? 'border-primary-700 bg-primary-700 dark:border-primary-650 dark:bg-primary-650 text-white' : 'border-border-color text-text-secondary bg-surface-0 hover:bg-surface-2'}"
				>
					{e}
				</button>
			{/each}
		</div>
	</div>

	<!-- Wasser-Tap-Counter -->
	<div>
		<div class="mb-1.5 block text-sm font-medium text-text-primary">💧 Wasser (Gläser)</div>
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={() => (water = Math.max(0, water - 1))}
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color bg-surface-2 text-xl font-bold text-text-primary hover:bg-surface-3 active:scale-95 transition-all"
			>−</button>
			<div class="flex-1 text-center">
				<span class="text-2xl font-bold text-primary-600 dark:text-primary-400">{water}</span>
				<div class="mt-1 flex gap-0.5 justify-center flex-wrap">
					{#each Array(Math.min(water, 12)) as _}
						<span class="text-base">💧</span>
					{/each}
				</div>
			</div>
			<button
				type="button"
				onclick={() => (water = Math.min(20, water + 1))}
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color bg-surface-2 text-xl font-bold text-text-primary hover:bg-surface-3 active:scale-95 transition-all"
			>+</button>
		</div>
	</div>

	<!-- Schlaf -->
	<label class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-text-primary">😴 Schlaf (Stunden)</span>
		<input
			type="number"
			bind:value={sleep}
			min="0" max="24" step="0.5"
			placeholder="z.B. 7.5"
			class="min-h-11 rounded-xl border border-border-color bg-surface-0 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none transition-colors duration-200"
		/>
	</label>

	<!-- Gewicht (optional) -->
	<label class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-text-primary">⚖️ Gewicht (kg, optional)</span>
		<input
			type="number"
			bind:value={weight}
			min="0" max="500" step="0.1"
			placeholder="z.B. 72.5"
			class="min-h-11 rounded-xl border border-border-color bg-surface-0 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none transition-colors duration-200"
		/>
	</label>

	<button
		onclick={save}
		disabled={saving}
		class="min-h-12 rounded-xl bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-sm font-medium text-white active:scale-95 disabled:opacity-60 transition-all"
	>
		{saving ? 'Speichere…' : '✓ Speichern'}
	</button>
</div>
