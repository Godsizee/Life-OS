<script lang="ts">
	import type { DayContext } from '../types';
	import { CheckSquare, Repeat, Dumbbell, Smile, Moon, Droplet, Zap } from 'lucide-svelte';

	let { context }: { context: DayContext } = $props();

	interface Chip {
		icon: typeof CheckSquare;
		label: string;
		show: boolean;
	}

	const chips = $derived<Chip[]>([
		{
			icon: CheckSquare,
			label: `${context.tasks_done}/${context.tasks_total} Aufgaben`,
			show: context.tasks_total > 0
		},
		{
			icon: Repeat,
			label: `${context.habits_logged}/${context.habits_due} Routinen`,
			show: context.habits_due > 0
		},
		{ icon: Dumbbell, label: 'Training', show: context.workout },
		{ icon: Smile, label: `Stimmung ${context.mood}/5`, show: context.mood !== null },
		{ icon: Moon, label: `${context.sleep_h} h Schlaf`, show: context.sleep_h !== null },
		{
			icon: Droplet,
			label: `${context.water_glasses} Gläser`,
			show: context.water_glasses !== null && context.water_glasses > 0
		},
		{ icon: Zap, label: `${context.focus_minutes} min Fokus`, show: context.focus_minutes > 0 }
	]);

	const visible = $derived(chips.filter((c) => c.show));
</script>

{#if visible.length > 0}
	<div class="flex flex-wrap gap-1.5">
		{#each visible as chip (chip.label)}
			{@const Icon = chip.icon}
			<span
				class="inline-flex items-center gap-1 rounded-full border border-border-color bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-secondary"
			>
				<Icon size={11} />
				{chip.label}
			</span>
		{/each}
	</div>
{/if}
