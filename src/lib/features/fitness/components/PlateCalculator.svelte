<script lang="ts">
	// Welle F6 — Platten-Rechner (Hevy/Strong-Muster): Zielgewicht → Scheiben pro Seite.
	// Bottom-Sheet wie ExercisePicker; Stangengewicht wird in localStorage gemerkt.
	import { X, Calculator } from 'lucide-svelte';
	import StepperInput from './StepperInput.svelte';
	import { calculatePlates, BAR_WEIGHTS_KG } from '../utils/plates';

	let {
		open = $bindable(false),
		initialWeightKg = null
	}: {
		open?: boolean;
		initialWeightKg?: number | null;
	} = $props();

	const BAR_KEY = 'lifeos:fitness:barweight';

	function loadBarWeight(): number {
		try {
			const raw = Number(localStorage.getItem(BAR_KEY));
			if (BAR_WEIGHTS_KG.includes(raw)) return raw;
		} catch {}
		return 20;
	}

	let barKg = $state(20);
	let targetKg = $state<number | null>(null);

	// Beim Öffnen mit dem aktuellen Satz-Gewicht vorbelegen.
	$effect(() => {
		if (open) {
			barKg = loadBarWeight();
			targetKg = initialWeightKg;
		}
	});

	function setBar(kg: number) {
		barKg = kg;
		try {
			localStorage.setItem(BAR_KEY, String(kg));
		} catch {}
	}

	const breakdown = $derived(
		targetKg !== null && targetKg > 0 ? calculatePlates(targetKg, barKg) : null
	);

	function close() {
		open = false;
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40 bg-black/45 dark:bg-black/60 backdrop-blur-sm" onclick={close}></div>

	<div
		data-noswipe
		class="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border-color bg-surface-0 shadow-2xl"
		role="dialog"
		aria-label="Platten-Rechner"
		aria-modal="true"
		style="padding-bottom: env(safe-area-inset-bottom);"
	>
		<div class="flex items-center justify-between px-4 pt-3 pb-2">
			<h3 class="flex items-center gap-2 text-sm font-bold text-text-primary">
				<Calculator size={15} class="text-primary-active" />
				<span>Platten-Rechner</span>
			</h3>
			<button
				onclick={close}
				aria-label="Schließen"
				class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
			>
				<X size={16} />
			</button>
		</div>

		<div class="space-y-4 px-4 pb-5">
			<div class="flex flex-wrap items-center gap-3">
				<div>
					<span class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Zielgewicht</span>
					<StepperInput bind:value={targetKg} step={2.5} placeholder="kg" unit="kg" label="Zielgewicht" />
				</div>
				<div>
					<span class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Stange</span>
					<div class="flex gap-1.5">
						{#each BAR_WEIGHTS_KG as kg (kg)}
							<button
								onclick={() => setBar(kg)}
								class="min-h-11 rounded-xl border px-3 text-xs font-bold transition-all
									{barKg === kg
										? 'border-primary-700 bg-primary-700 text-white dark:border-primary-600 dark:bg-primary-600'
										: 'border-border-color bg-surface-0 text-text-secondary hover:bg-surface-1'}"
							>
								{kg} kg
							</button>
						{/each}
					</div>
				</div>
			</div>

			{#if breakdown === null && targetKg !== null && targetKg > 0}
				<p class="text-sm text-text-secondary">Zielgewicht liegt unter dem Stangengewicht.</p>
			{:else if breakdown}
				<div class="rounded-2xl border border-border-color bg-surface-1/50 p-4">
					<p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
						Pro Seite ({breakdown.perSideKg} kg)
					</p>
					{#if breakdown.perSide.length === 0}
						<p class="text-sm text-text-secondary">Keine Scheiben nötig — nur die Stange.</p>
					{:else}
						<div class="flex flex-wrap items-end gap-1.5">
							{#each breakdown.perSide as p (p.plateKg)}
								{#each Array(p.count) as _, i (i)}
									<span
										class="flex items-center justify-center rounded-md bg-primary-700 font-bold text-white dark:bg-primary-600"
										style="width: {Math.max(26, Math.min(44, p.plateKg * 1.6))}px; height: {Math.max(34, Math.min(72, p.plateKg * 2.4))}px; font-size: 10px;"
									>
										{p.plateKg}
									</span>
								{/each}
							{/each}
						</div>
					{/if}
					{#if breakdown.remainderKg > 0}
						<p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
							{breakdown.remainderKg} kg pro Seite nicht abbildbar (kleinste Scheibe 1,25 kg).
						</p>
					{/if}
				</div>
			{:else}
				<p class="text-sm text-text-tertiary">Gib ein Zielgewicht ein.</p>
			{/if}
		</div>
	</div>
{/if}
