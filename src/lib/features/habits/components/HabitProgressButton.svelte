<script lang="ts">
	import { habitsState } from '../store.svelte';
	import type { Habit } from '../types';
	import { Check } from '@lucide/svelte';
	import { isCompleted, isSkipped, targetOf } from '../streak';
	import Ring from '#lib/ui/charts/Ring.svelte';

	interface Props {
		habit: Habit;
		onLog?: () => void;
	}
	const { habit, onLog }: Props = $props();

	const target = $derived(targetOf(habit));
	const day = $derived(habitsState.entryToday(habit.id));
	const current = $derived(day?.value ?? 0);
	const skipped = $derived(isSkipped(day));
	const done = $derived(isCompleted(habit, day));

	// Progress in % (max 100)
	const pct = $derived(skipped ? 0 : Math.min(100, Math.round((current / target) * 100)));

	async function handleClick(e: MouseEvent) {
		e.stopPropagation();
		if (habit.target_value && habit.target_value > 1) {
			if (skipped)
				await habitsState.setValueToday(habit.id, 1); // Überschreibt Skip
			else if (current < target) await habitsState.incrementToday(habit.id, 1);
			else await habitsState.toggleToday(habit.id); // Wenn voll, dann leeren
		} else {
			await habitsState.toggleToday(habit.id);
		}
		if (onLog) onLog();
	}
</script>

<button
	class="relative flex h-10 w-10 shrink-0 items-center justify-center transition-transform hover:scale-105 active:scale-95"
	onclick={handleClick}
	aria-label="Fortschritt erhöhen"
>
	<!-- Standard-Routinen (Häkchen) oder komplett erledigt -->
	{#if !habit.target_value || done}
		<div
			class="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all
				{done
				? 'border-primary-500 bg-primary-500 text-white'
				: skipped
					? 'border-border-color bg-surface-2 text-transparent'
					: 'border-border-color bg-surface-0 text-transparent'}"
		>
			{#if skipped}
				<span class="text-xs text-text-tertiary">S</span>
			{:else}
				<Check size={18} strokeWidth={3} />
			{/if}
		</div>
	{:else}
		<!-- Mengen-Routinen: Fortschrittsring -->
		<Ring
			wert={skipped ? 0 : pct}
			groesse={40}
			strich={11}
			rahmen={false}
			farbe="habits"
			beschreibung={skipped ? 'Heute übersprungen' : `${current} von ${target}`}
		>
			{#snippet mitte()}
				<span class="text-[11px] font-bold tabular-nums">{skipped ? 'S' : current}</span>
			{/snippet}
		</Ring>
	{/if}
</button>
