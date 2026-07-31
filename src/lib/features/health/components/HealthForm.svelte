<script lang="ts">
	import { healthState } from '../store.svelte';
	import { waterMl } from '../stats';
	import { profileState } from '$lib/features/profile/store.svelte';
	import { kgToLb, lbToKg } from '$lib/features/profile/units';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';

	let {
		date = healthState.todayKey(),
		onsaved
	}: {
		/** W9 — welcher Tag bearbeitet wird ('yyyy-mm-dd'). Default: heute. */
		date?: string;
		onsaved?: () => void;
	} = $props();

	let weight = $state('');
	let sleep = $state('');
	let water = $state(0);
	let energy = $state<number | null>(null);
	let saving = $state(false);
	let hydratedFor = $state<string | null>(null);

	// Genau einmal je Eintrag befuellen — sonst ueberschreibt jedes Realtime-Event
	// die laufende Eingabe.
	$effect(() => {
		const e = healthState.entryForDate(date);
		const key = `${date}:${e?.id ?? 'new'}`;
		if (key === hydratedFor) return;
		hydratedFor = key;
		const w = e?.weight_kg != null ? (profileState.weightUnit === 'lb' ? kgToLb(e.weight_kg) : e.weight_kg) : null;
		weight = w != null ? String(Math.round(w * 10) / 10) : '';
		sleep = e?.sleep_h != null ? String(e.sleep_h) : '';
		water = e ? (waterMl(e) ?? 0) : 0;
		energy = e?.energy ?? null;
	});

	async function save() {
		saving = true;
		try {
			const parsedWeight = weight ? parseFloat(weight) : null;
			await healthState.saveFor(date, {
				weight_kg: parsedWeight != null ? (profileState.weightUnit === 'lb' ? lbToKg(parsedWeight) : parsedWeight) : null,
				sleep_h: sleep ? parseFloat(sleep) : null,
				water_ml: water || null,
				energy
			});
			onsaved?.();
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
			{#each [1, 2, 3, 4, 5] as e (e)}
				<button
					type="button"
					onclick={() => (energy = e)}
					class="flex h-10 flex-1 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all active:scale-95
						{energy === e ? 'border-primary-700 bg-primary-700 dark:border-primary-600 dark:bg-primary-600 text-white' : 'border-border-color text-text-secondary bg-surface-0 hover:bg-surface-2'}"
				>
					{e}
				</button>
			{/each}
		</div>
	</div>

	<!-- Wasser -->
	<div>
		<div class="mb-1.5 block text-sm font-medium text-text-primary">
			💧 Wasser ({profileState.waterUnit === 'ml' ? 'ml' : 'Gläser'})
		</div>
		{#if profileState.waterUnit === 'ml'}
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-3">
					<div class="flex-1 text-center">
						<span class="text-2xl font-bold text-primary-600 dark:text-primary-400">{water}</span>
						<span class="ml-1 text-xs text-text-tertiary">/ {profileState.waterGoalMl} ml</span>
					</div>
					<button
						type="button"
						onclick={() => (water = 0)}
						class="h-8 px-3 rounded text-sm bg-surface-2 text-text-secondary hover:bg-surface-3 transition-all"
					>Reset</button>
				</div>
				<div class="flex gap-2">
					<button type="button" onclick={() => (water = Math.min(15000, water + 250))} class="flex-1 h-10 rounded-xl border border-border-color bg-surface-1 hover:bg-surface-2 transition-all font-medium text-sm">+250</button>
					<button type="button" onclick={() => (water = Math.min(15000, water + 500))} class="flex-1 h-10 rounded-xl border border-border-color bg-surface-1 hover:bg-surface-2 transition-all font-medium text-sm">+500</button>
					<button type="button" onclick={() => (water = Math.min(15000, water + 1000))} class="flex-1 h-10 rounded-xl border border-border-color bg-surface-1 hover:bg-surface-2 transition-all font-medium text-sm">+1000</button>
				</div>
			</div>
		{:else}
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => (water = Math.max(0, water - profileState.glassSizeMl))}
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color bg-surface-2 text-xl font-bold text-text-primary hover:bg-surface-3 active:scale-95 transition-all"
				>−</button>
				<div class="flex-1 text-center">
					<span class="text-2xl font-bold text-primary-600 dark:text-primary-400">{Math.round(water / profileState.glassSizeMl)}</span>
					<span class="ml-1 text-xs text-text-tertiary">/ {profileState.waterGoalGlasses}</span>
					<div class="mt-1 flex gap-0.5 justify-center flex-wrap">
						{#each Array.from({ length: Math.min(Math.round(water / profileState.glassSizeMl), 12) }, (_, i) => i) as i (i)}
							<span class="text-base">💧</span>
						{/each}
					</div>
				</div>
				<button
					type="button"
					onclick={() => (water = Math.min(15000, water + profileState.glassSizeMl))}
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color bg-surface-2 text-xl font-bold text-text-primary hover:bg-surface-3 active:scale-95 transition-all"
				>+</button>
			</div>
		{/if}
	</div>

	<!-- Schlaf -->
	<Field label="😴 Schlaf (Stunden)" hint="Ziel: {profileState.sleepGoalH} h">
		<Input type="number" bind:value={sleep} min="0" max="24" step="0.5" placeholder="z.B. 7.5" />
	</Field>

	<!-- Gewicht (optional) -->
	<Field label="⚖️ Gewicht ({profileState.weightUnit}, optional)">
		<Input type="number" bind:value={weight} min="0" max="1000" step="0.1" placeholder={profileState.weightUnit === 'lb' ? 'z.B. 160.0' : 'z.B. 72.5'} />
	</Field>

	<Button onclick={save} disabled={saving}>
		{#snippet children()}
			{saving ? 'Speichere…' : '✓ Speichern'}
		{/snippet}
	</Button>
</div>
