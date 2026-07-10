<script lang="ts">
	import { healthState } from '$lib/features/health/store.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import HealthForm from '$lib/features/health/components/HealthForm.svelte';

	$effect(() => {
		if (workspaceState.workspace?.id) healthState.load();
	});

	// 14-Tage-Tabelle (neueste zuerst, d.h. bereits absteigend aus API)
	const recent = $derived(healthState.entries.slice(0, 14));

	function bar(val: number | null, max: number): number {
		if (val == null) return 0;
		return Math.min(100, Math.round((val / max) * 100));
	}
</script>

<svelte:head>
	<title>Gesundheit - Life OS</title>
</svelte:head>

<header class="mb-4">
	<h1 class="text-2xl font-bold tracking-tight">Körper & Gesundheit</h1>
	<p class="text-sm text-text-secondary">Täglicher Check-in</p>
</header>

<!-- Tages-Form -->
<div class="mb-4 rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
	<h2 class="mb-3 text-sm font-semibold text-text-primary">Heute erfassen</h2>
	<HealthForm />
</div>

<!-- 14-Tage-Übersicht -->
{#if recent.length > 0}
	<div class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">14-Tage-Übersicht</h2>
		<div class="flex flex-col gap-2">
			{#each recent as entry (entry.id)}
				<div class="rounded-lg bg-surface-2 p-2 border border-border-color/30">
					<div class="flex items-center justify-between">
						<span class="text-xs font-medium text-text-primary">
							{new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
						</span>
						<span class="flex gap-2 text-xs text-text-secondary">
							{#if entry.energy != null}<span>⚡{entry.energy}/5</span>{/if}
							{#if entry.weight_kg != null}<span>⚖️{entry.weight_kg}kg</span>{/if}
						</span>
					</div>
					<div class="mt-1.5 flex flex-col gap-1">
						{#if entry.sleep_h != null}
							<div class="flex items-center gap-2">
								<span class="w-5 text-xs">😴</span>
								<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
									<div class="h-full bg-primary-400" style="width: {bar(entry.sleep_h, 10)}%"></div>
								</div>
								<span class="w-8 text-right text-xs text-text-secondary">{entry.sleep_h}h</span>
							</div>
						{/if}
						{#if entry.water_glasses != null}
							<div class="flex items-center gap-2">
								<span class="w-5 text-xs">💧</span>
								<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
									<div class="h-full bg-primary-500" style="width: {bar(entry.water_glasses, 8)}%"></div>
								</div>
								<span class="w-8 text-right text-xs text-text-secondary">{entry.water_glasses}x</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
