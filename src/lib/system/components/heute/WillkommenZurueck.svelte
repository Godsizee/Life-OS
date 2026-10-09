<script lang="ts">
	import { toISODate } from '#lib/core/date.js';
	import { fuegePauseHinzu } from '#lib/core/ruhe.js';
	import { toastState } from '#lib/core/toast.svelte.js';
	import { tasksState } from '#lib/features/tasks/store.svelte.js';
	import Box from '#lib/ui/Box.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Input from '#lib/ui/Input.svelte';
	import { istAktiv } from '../../module-aktiv.svelte.js';
	import {
		alteKlaerungen,
		fristAmTag,
		fristenVorbei,
		ohnePlan,
		pauseNachtragen,
		tageWeg
	} from '../../willkommen-kern.js';
	import { willkommen } from '../../willkommen.svelte.js';

	let schritt = $state<'start' | 'fristen' | 'nachtrag'>('start');

	const heute = $derived(willkommen.heute);
	const weg = $derived(tageWeg(willkommen.zuletzt, heute) ?? 0);
	const wartend = $derived(ohnePlan(tasksState.tasks, heute));
	const fristen = $derived(fristenVorbei(tasksState.tasks, toISODate(new Date())));
	const pause = $derived(istAktiv('habits') ? pauseNachtragen(willkommen.zuletzt, heute) : null);

	function tagKurz(iso: string): string {
		const [, m, t] = iso.split('-');
		return `${Number(t)}.${Number(m)}.`;
	}

	async function neuStarten() {
		const betroffen = alteKlaerungen(tasksState.tasks, heute);
		const vorher = betroffen.map((t) => ({
			id: t.id,
			planned_for: t.planned_for,
			scheduled_start: t.scheduled_start
		}));
		for (const t of betroffen) await tasksState.planen(t.id, { planned_for: null });
		if (vorher.length > 0) {
			toastState.withAction(
				'info',
				vorher.length === 1
					? '1 Aufgabe liegt jetzt bei „Später“. Fristen bleiben.'
					: `${vorher.length} Aufgaben liegen jetzt bei „Später“. Fristen bleiben.`,
				{
					label: 'Rückgängig',
					run: () => {
						for (const v of vorher) {
							void tasksState.planen(v.id, {
								planned_for: v.planned_for,
								scheduled_start: v.scheduled_start
							});
						}
					}
				}
			);
		}
		if (pause) schritt = 'nachtrag';
		else willkommen.verbergen();
	}

	async function pauseEintragen() {
		if (pause) await fuegePauseHinzu(pause);
		toastState.success('Pause eingetragen. Deine Serien bleiben erhalten.');
		willkommen.verbergen();
	}

	function neueFrist(id: string, datum: string) {
		if (!datum) return;
		void tasksState.updateTask(id, { due_at: fristAmTag(datum) });
	}
</script>

<Box titel="Willkommen zurück">
	<div class="flex flex-col gap-3 p-4">
		{#if schritt === 'start'}
			<p class="font-semibold">
				Du warst {weg}
				{weg === 1 ? 'Tag' : 'Tage'} weg. Wie willst du starten?
			</p>
			{#if wartend > 0}
				<p class="text-text-2">
					Es {wartend === 1 ? 'wartet' : 'warten'}
					{wartend}
					{wartend === 1 ? 'Aufgabe' : 'Aufgaben'} ohne Plan.
				</p>
			{/if}
			<div class="flex flex-wrap gap-2">
				<Button onclick={neuStarten}>Neu starten</Button>
				<Button variant="sekundaer" onclick={() => (schritt = 'fristen')}>Fristen durchsehen</Button
				>
				<Button variant="ghost" onclick={() => willkommen.verbergen()}>Erst umsehen</Button>
			</div>
			<p class="mono-label text-text-3">Neu starten nimmt alte Pläne vom Tag. Fristen bleiben.</p>
		{:else if schritt === 'fristen'}
			{#if fristen.length === 0}
				<p class="font-semibold">Keine Frist liegt mehr hinter dir.</p>
			{:else}
				<p class="font-semibold">Neue Frist setzen oder Frist entfernen:</p>
				<ul class="flex flex-col">
					{#each fristen as task (task.id)}
						<li
							class="flex flex-col gap-2 border-b-[length:var(--rahmen-s)] border-tinte py-3 first:pt-0 last:border-b-0"
						>
							<p class="min-w-0 font-semibold">{task.title}</p>
							<p class="mono-label text-text-3">
								Frist war {tagKurz(toISODate(new Date(task.due_at ?? '')))}
							</p>
							<div class="flex flex-wrap items-center gap-2">
								<label class="flex flex-col gap-1 text-sm">
									<span class="mono-label">Neue Frist</span>
									<Input
										type="date"
										min={heute}
										class="w-auto"
										onchange={(e) => neueFrist(task.id, e.currentTarget.value)}
									/>
								</label>
								<Button
									size="sm"
									variant="sekundaer"
									onclick={() => tasksState.updateTask(task.id, { due_at: null })}
								>
									Frist entfernen
								</Button>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
			<div class="flex flex-wrap gap-2">
				<Button variant="sekundaer" onclick={() => (schritt = 'start')}>Zurück</Button>
				<Button variant="ghost" onclick={() => willkommen.verbergen()}>Fertig</Button>
			</div>
		{:else if pause}
			<p class="font-semibold">
				Du warst vom {tagKurz(pause.von)} bis {tagKurz(pause.bis)} weg. Soll für deine Routinen eine Pause
				eingetragen werden?
			</p>
			<p class="text-text-2">Deine Serien bleiben dann erhalten.</p>
			<div class="flex flex-wrap gap-2">
				<Button onclick={pauseEintragen}>Pause eintragen</Button>
				<Button variant="ghost" onclick={() => willkommen.verbergen()}>Nein, danke</Button>
			</div>
		{/if}
	</div>
</Box>
