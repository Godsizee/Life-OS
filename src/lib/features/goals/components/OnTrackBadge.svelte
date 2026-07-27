<script lang="ts">
	// W8 — Soll-Ist-Ampel für Ziele mit Zieldatum. Reine Darstellung.
	import { TrendingUp, Check, Minus, AlertTriangle, Trophy } from 'lucide-svelte';
	import type { TrackResult } from '../checkins';

	let { track, compact = false }: { track: TrackResult; compact?: boolean } = $props();

	const style = $derived(
		{
			ahead: { icon: TrendingUp, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40' },
			on_track: { icon: Check, cls: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/30 dark:text-primary-400 dark:border-primary-900/40' },
			behind: { icon: Minus, cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40' },
			overdue: { icon: AlertTriangle, cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40' },
			done: { icon: Trophy, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40' },
			no_date: { icon: Minus, cls: '' }
		}[track.state]
	);
</script>

{#if track.state !== 'no_date'}
	{@const Icon = style.icon}
	<span
		class="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold {style.cls}"
		title="Soll {track.expected} % · Ist {track.actual} %"
	>
		<Icon size={11} />
		{#if !compact}{track.label}{/if}
	</span>
{/if}
