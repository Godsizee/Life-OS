<script lang="ts">
	// W8 — Minimalistischer Entry-Point am Seitenende.
	import { PenTool } from 'lucide-svelte';
	import { goalsState } from '../store.svelte';

	let { onOpen }: { onOpen: (date: string) => void } = $props();

	// Wenn heute schon etwas steht, sagen wir "Tagebuch bearbeiten", sonst "Tagebuch schreiben".
	const hasToday = $derived(!!goalsState.todayEntry);
</script>

<button
	onclick={() => onOpen(goalsState.todayKey)}
	class="flex w-full items-center gap-3 rounded-2xl border border-border-color bg-surface-0 p-4 text-left transition-colors hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 active:scale-[0.98]"
>
	<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
		<PenTool size={20} />
	</div>
	<div class="flex-1">
		<p class="font-bold text-text-primary">
			{hasToday ? 'Tagebucheintrag bearbeiten' : 'Tagebuch schreiben'}
		</p>
		<p class="text-xs text-text-secondary">Was beschäftigt dich heute?</p>
	</div>
</button>
