<script lang="ts">
	import type { Task } from '$lib/features/tasks/types';

	let {
		openTasks,
		selected,
		onToggle,
		onBack,
		onNext
	}: {
		openTasks: Task[];
		selected: string[];
		onToggle: (id: string) => void;
		onBack: () => void;
		onNext: () => void;
	} = $props();
</script>

<section class="flex flex-col gap-4">
	<div>
		<h2 class="text-lg font-semibold text-text-primary">Nächste Woche</h2>
		<p class="mt-1 text-sm text-text-secondary">Wähle deine Top-3 Aufgaben für die nächste Woche.</p>
	</div>

	{#if openTasks.length === 0}
		<p class="rounded-xl border border-border-color bg-surface-0 p-4 text-sm text-text-secondary">
			Keine offenen Aufgaben — sieht gut aus! 🎉
		</p>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each openTasks.slice(0, 15) as task (task.id)}
				{@const isSelected = selected.includes(task.id)}
				<li>
					<button
						onclick={() => onToggle(task.id)}
						disabled={!isSelected && selected.length >= 3}
						class="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors
							{isSelected
							? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20'
							: 'border-border-color bg-surface-0'}
							disabled:opacity-40"
					>
						<span
							class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors
								{isSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-border-color'}"
						>
							{#if isSelected}✓{/if}
						</span>
						<span class="min-w-0 flex-1 text-sm text-text-primary">{task.title}</span>
						{#if task.priority === 'high'}
							<span class="shrink-0 text-xs font-medium text-red-500">!</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
		{#if openTasks.length > 15}
			<p class="text-xs text-text-tertiary">Nur die ersten 15 angezeigt — ggf. Tasks priorisieren.</p>
		{/if}
	{/if}

	<p class="text-center text-sm text-text-secondary">
		{selected.length}/3 ausgewählt
	</p>

	<div class="flex gap-3">
		<button
			onclick={onBack}
			class="min-h-12 flex-1 rounded-xl border border-border-color bg-surface-0 text-sm font-medium text-text-secondary hover:bg-surface-1"
		>
			← Zurück
		</button>
		<button
			onclick={onNext}
			class="min-h-12 flex-1 rounded-xl bg-primary-600 text-sm font-medium text-white active:bg-primary-700"
		>
			Weiter →
		</button>
	</div>
</section>
