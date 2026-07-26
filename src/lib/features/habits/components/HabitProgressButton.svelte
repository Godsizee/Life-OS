<script lang="ts">
	import { habitsState } from '../store.svelte';
	import type { Habit } from '../types';
	import { Check } from 'lucide-svelte';
	import { isCompleted, isSkipped, targetOf } from '../streak';

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
			if (skipped) await habitsState.setValueToday(habit.id, 1); // Überschreibt Skip
			else if (current < target) await habitsState.incrementToday(habit.id, 1);
			else await habitsState.toggleToday(habit.id); // Wenn voll, dann leeren
		} else {
			await habitsState.toggleToday(habit.id);
		}
		if (onLog) onLog();
	}

	const circumference = 2 * Math.PI * 14;
	const offset = $derived(circumference - (pct / 100) * circumference);
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
		<!-- Mengen-Routinen: SVG Progress Ring -->
		<svg class="h-10 w-10 -rotate-90 transform" viewBox="0 0 32 32">
			<!-- Track -->
			<circle
				cx="16"
				cy="16"
				r="14"
				class={skipped ? 'text-surface-2' : 'text-surface-1'}
				stroke="currentColor"
				stroke-width="3"
				fill="none"
			/>
			<!-- Progress -->
			<circle
				cx="16"
				cy="16"
				r="14"
				class="text-primary-500 transition-all duration-300"
				stroke="currentColor"
				stroke-width="3"
				fill="none"
				stroke-dasharray={circumference}
				stroke-dashoffset={skipped ? circumference : offset}
				stroke-linecap="round"
			/>
		</svg>
		{#if skipped}
			<span class="absolute text-[10px] font-bold text-text-tertiary">S</span>
		{:else}
			<span class="absolute text-[10px] font-bold text-text-secondary">{current}</span>
		{/if}
	{/if}
</button>
