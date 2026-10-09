<script lang="ts">
	import { toISODate } from '#lib/core/date.js';
	import { tasksState } from '#lib/features/tasks/store.svelte.js';
	import type { Task } from '#lib/features/tasks/types.js';
	import Button from '#lib/ui/Button.svelte';
	import Input from '#lib/ui/Input.svelte';

	let {
		task,
		kompakt = false,
		onentschieden
	}: {
		task: Task;
		/** Kompakt (in „Tag planen“): zusätzlich „Heute“, ohne den Hinweis zum Verwerfen. */
		kompakt?: boolean;
		/** Wird nach jeder Entscheidung gerufen, damit die Liste die Zeile ausblenden kann. */
		onentschieden: (id: string) => void;
	} = $props();

	let teilen = $state(false);
	let schritt = $state('');

	const tag = (versatz: number) => {
		const d = new Date();
		d.setDate(d.getDate() + versatz);
		return toISODate(d);
	};

	async function entscheide(aktion: () => Promise<void>) {
		await aktion();
		onentschieden(task.id);
	}

	/** Der erste kleine Schritt wird zur Unteraufgabe für morgen; die große Aufgabe verlässt den Tag. */
	async function aufteilen() {
		const titel = schritt.trim();
		if (!titel) return;
		await entscheide(async () => {
			await tasksState.addTask({ title: titel, parent_id: task.id, planned_for: tag(1) });
			await tasksState.planen(task.id, { planned_for: null });
		});
	}
</script>

<li
	class="flex flex-col gap-2 border-b-[length:var(--rahmen-s)] border-tinte px-3 py-3 last:border-b-0"
>
	<p class="font-semibold">{task.title}</p>
	<div class="flex flex-wrap gap-2">
		{#if kompakt}
			<Button
				size="sm"
				variant="sekundaer"
				onclick={() => entscheide(() => tasksState.planen(task.id, { planned_for: tag(0) }))}
			>
				Heute
			</Button>
		{:else}
			<Button
				size="sm"
				variant="sekundaer"
				onclick={() => entscheide(() => tasksState.setStatus(task.id, 'done'))}
			>
				Erledigt
			</Button>
		{/if}
		<Button
			size="sm"
			variant="sekundaer"
			onclick={() => entscheide(() => tasksState.planen(task.id, { planned_for: tag(1) }))}
		>
			Morgen
		</Button>
		<Button
			size="sm"
			variant="sekundaer"
			onclick={() => entscheide(() => tasksState.planen(task.id, { planned_for: null }))}
		>
			Später
		</Button>
		<Button size="sm" variant="sekundaer" onclick={() => (teilen = !teilen)}>Aufteilen</Button>
		{#if kompakt}
			<Button
				size="sm"
				variant="sekundaer"
				onclick={() => entscheide(() => tasksState.setStatus(task.id, 'done'))}
			>
				Erledigt
			</Button>
		{/if}
		<Button
			size="sm"
			variant="ghost"
			onclick={() => entscheide(() => tasksState.setStatus(task.id, 'dropped'))}
		>
			Verwerfen
		</Button>
	</div>
	{#if !kompakt}
		<p class="mono-label text-text-3">Verwerfen ist eine Entscheidung.</p>
	{/if}
	{#if teilen}
		<form
			class="flex flex-wrap items-end gap-2"
			onsubmit={(e) => {
				e.preventDefault();
				void aufteilen();
			}}
		>
			<div class="min-w-0 flex-1">
				<Input
					bind:value={schritt}
					placeholder="Erster kleiner Schritt"
					aria-label="Erster kleiner Schritt"
				/>
			</div>
			<Button type="submit" size="sm">Für morgen anlegen</Button>
		</form>
	{/if}
</li>
