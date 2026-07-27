<script lang="ts">
	// W6 — Zeiteinträge einer Aufgabe (oder eines Tages) mit Löschen.
	// Einträge sind unveränderlich: Korrigieren = löschen + neu buchen.
	import { timeTrackingState } from '../store.svelte';
	import { formatMinutes, minutesOf } from '../stats';
	import { formatShortDate } from '$lib/core/date';
	import { Trash2 } from 'lucide-svelte';
	import type { TimeEntry } from '../types';

	let { entries }: { entries: TimeEntry[] } = $props();
</script>

{#if entries.length > 0}
	<ul class="flex flex-col divide-y divide-border-color">
		{#each entries as entry (entry.id)}
			<li class="flex items-center gap-2 py-2">
				<span class="w-20 shrink-0 text-xs tabular-nums text-text-secondary">
					{formatMinutes(minutesOf(entry))}
				</span>
				<span class="w-24 shrink-0 text-xs text-text-tertiary">
					{formatShortDate(entry.started_at)}
				</span>
				<span class="min-w-0 flex-1 truncate text-xs text-text-tertiary">
					{entry.note ?? (entry.source === 'pomodoro' ? 'Fokus-Runde' : 'Nachtrag')}
				</span>
				<button
					onclick={() => timeTrackingState.remove(entry.id)}
					aria-label="Eintrag löschen"
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-2 hover:text-red-500 active:scale-95"
				>
					<Trash2 size={14} />
				</button>
			</li>
		{/each}
	</ul>
{/if}
