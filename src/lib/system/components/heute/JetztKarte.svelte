<script lang="ts">
	import { goto } from '$app/navigation';
	import { nichtJetzt } from '#lib/config/heute.js';
	import { modules } from '#lib/config/modules.js';
	import { formatUhr, toISODate } from '#lib/core/date.js';
	import { setze, wert } from '#lib/core/einstellungen.js';
	import type { AgendaEintrag } from '#lib/core/modul.js';
	import { liveWorkoutState } from '#lib/features/fitness/live-workout.svelte.js';
	import { focusSession } from '#lib/features/focus/session.svelte.js';
	import { habitsState } from '#lib/features/habits/store.svelte.js';
	import { tasksState } from '#lib/features/tasks/store.svelte.js';
	import Button from '#lib/ui/Button.svelte';
	import type { Tagesplan } from '../../agenda.js';
	import { idAusKey, ohneZurueckgestellte, stelleZurueck } from '../../heute-logik.js';
	import { istLaufend, waehleJetzt, type Laufend } from '../../jetzt.js';

	let { plan, jetzt }: { plan: Tagesplan; jetzt: Date } = $props();

	const laufend = $derived.by<Laufend>(() => {
		if (focusSession.active) {
			const task = tasksState.tasks.find((t) => t.id === focusSession.taskId);
			return {
				art: 'fokus',
				titel: task?.title ?? 'Fokus-Runde',
				href: '/focus',
				seit: focusSession.startedAt ? new Date(focusSession.startedAt) : jetzt
			};
		}
		if (liveWorkoutState.active) {
			return { art: 'training', titel: 'Training läuft', href: '/fitness', seit: jetzt };
		}
		return null;
	});

	const gewaehlt = $derived(
		waehleJetzt(ohneZurueckgestellte(plan, wert(nichtJetzt), jetzt), laufend, jetzt)
	);

	const eintrag = $derived(gewaehlt && !istLaufend(gewaehlt) ? gewaehlt : null);
	const sitzung = $derived(gewaehlt && istLaufend(gewaehlt) ? gewaehlt : null);
	const aufgabeId = $derived(eintrag ? idAusKey(eintrag.key, 'tasks') : null);
	const routineId = $derived(eintrag ? idAusKey(eintrag.key, 'habits') : null);

	const modulName = (e: AgendaEintrag) => modules.find((m) => m.id === e.modul)?.label ?? '';

	function zeitText(e: AgendaEintrag): string | null {
		if (e.ganztags) return 'Ganztägig';
		if (!e.start) return null;
		return e.ende ? `${formatUhr(e.start)}–${formatUhr(e.ende)}` : formatUhr(e.start);
	}

	async function erledigt() {
		if (aufgabeId) await tasksState.setStatus(aufgabeId, 'done');
		else if (routineId) await habitsState.toggleToday(routineId);
	}

	async function verschieben() {
		if (!aufgabeId) return;
		const morgen = new Date(jetzt);
		morgen.setDate(morgen.getDate() + 1);
		await tasksState.planen(aufgabeId, { planned_for: toISODate(morgen) });
	}

	async function nichtJetztSetzen() {
		if (eintrag) await setze(nichtJetzt, stelleZurueck(wert(nichtJetzt), eintrag.key, jetzt));
	}
</script>

{#if gewaehlt}
	<section
		aria-labelledby="jetzt-titel"
		class="box bg-signal text-auf-farbe"
		style="box-shadow: var(--schatten)"
	>
		<div class="flex flex-col gap-3 p-4">
			<div class="mono-label flex items-center justify-between gap-3">
				<h2 id="jetzt-titel">Jetzt</h2>
				<span>
					{#if sitzung}{sitzung.art === 'fokus' ? 'Fokus' : 'Training'}{:else if eintrag}{modulName(
							eintrag
						)}{/if}
				</span>
			</div>

			{#if sitzung}
				<p class="text-xl leading-tight font-extrabold [font-stretch:85%]">{sitzung.titel}</p>
				<p class="mono-label">Seit {formatUhr(sitzung.seit)}</p>
				<div><Button variant="sekundaer" onclick={() => goto(sitzung.href)}>Weiter</Button></div>
			{:else if eintrag}
				<p class="text-xl leading-tight font-extrabold [font-stretch:85%]">{eintrag.titel}</p>
				<p class="mono-label">
					{[zeitText(eintrag), eintrag.warum].filter(Boolean).join(' · ')}
				</p>
				<div class="flex flex-wrap gap-2">
					{#if aufgabeId}
						<Button variant="sekundaer" onclick={() => goto(`/focus?task=${aufgabeId}`)}>
							Start
						</Button>
						<Button variant="sekundaer" onclick={erledigt}>Erledigt</Button>
						<Button variant="sekundaer" onclick={verschieben}>Verschieben</Button>
					{:else if routineId}
						<Button variant="sekundaer" onclick={erledigt}>Erledigt</Button>
					{:else}
						<Button variant="sekundaer" onclick={() => goto(eintrag.href)}>Öffnen</Button>
					{/if}
					<Button variant="ghost" onclick={nichtJetztSetzen}>Nicht jetzt</Button>
				</div>
			{/if}
		</div>
	</section>
{/if}
