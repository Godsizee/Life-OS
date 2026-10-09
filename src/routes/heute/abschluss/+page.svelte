<script lang="ts">
	import { goto } from '$app/navigation';
	import { X } from '@lucide/svelte';
	import { toISODate } from '#lib/core/date.js';
	import { emit } from '#lib/core/ereignisse.js';
	import { ritualeState } from '#lib/features/dashboard/rituale.svelte.js';
	import { goalsState } from '#lib/features/goals/store.svelte.js';
	import { moodState } from '#lib/features/mood/store.svelte.js';
	import { MOOD_LABELS } from '#lib/features/mood/types.js';
	import { istErledigt, istOffen } from '#lib/features/tasks/status.js';
	import { tasksState } from '#lib/features/tasks/store.svelte.js';
	import { timeTrackingState } from '#lib/features/timetracking/store.svelte.js';
	import { formatMinutes } from '#lib/features/timetracking/stats.js';
	import AbschlussEntscheidung from '#lib/system/components/heute/AbschlussEntscheidung.svelte';
	import { istAktiv } from '#lib/system/module-aktiv.svelte.js';
	import { fuerMorgen, heuteOffen } from '#lib/system/ritual-logik.js';
	import Button from '#lib/ui/Button.svelte';
	import Chip from '#lib/ui/Chip.svelte';
	import Input from '#lib/ui/Input.svelte';
	import Schritte from '#lib/ui/Schritte.svelte';

	const NAMEN = ['Geschafft', 'Offen', 'Reflexion', 'Morgen'];
	const jetzt = new Date();
	const heute = toISODate(jetzt);
	const morgenTag = () => {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		return toISODate(d);
	};

	let schritt = $state(0);
	let speichert = $state(false);

	// ── Geschafft ────────────────────────────────────────────────────
	const erledigt = $derived(
		tasksState.tasks.filter(
			(t) => istErledigt(t) && !!t.completed_at && toISODate(new Date(t.completed_at)) === heute
		)
	);

	// ── Offen ────────────────────────────────────────────────────────
	let entschieden = $state<string[]>([]);
	const offen = $derived(
		heuteOffen(tasksState.tasks, jetzt).filter((t) => !entschieden.includes(t.id))
	);

	async function alleAufMorgen() {
		const ziel = morgenTag();
		for (const t of offen) await tasksState.planen(t.id, { planned_for: ziel });
		entschieden = [...entschieden, ...offen.map((t) => t.id)];
	}

	// ── Reflexion ────────────────────────────────────────────────────
	const stimmung = $derived(moodState.todayEntry?.score ?? null);
	let gutGelaufen = $state('');

	/** Hängt den Satz an den heutigen Tagebucheintrag an. Das Tagebuch ist privat (RLS owner-only). */
	async function reflexionSpeichern() {
		const satz = gutGelaufen.trim();
		if (!satz || !istAktiv('journal')) return;
		const bestand = goalsState.todayEntry;
		const text = bestand?.body
			? `${bestand.body}\n\nWas lief gut? ${satz}`
			: `Was lief gut? ${satz}`;
		await goalsState.saveTodayEntry(bestand?.mood ?? null, text);
		gutGelaufen = '';
	}

	// ── Morgen ───────────────────────────────────────────────────────
	const fuerMorgenGewaehlt = $derived(
		tasksState.tasks.filter((t) => t.planned_for === morgenTag() && istOffen(t))
	);
	// Schon gewählte bleiben in der Liste (und lassen sich wieder abwählen), danach die Vorschläge.
	const vorschlaege = $derived([...fuerMorgenGewaehlt, ...fuerMorgen(tasksState.tasks, jetzt)]);
	const gewaehlt = $derived(fuerMorgenGewaehlt.length);

	async function toggleMorgen(id: string, an: boolean) {
		await tasksState.planen(id, { planned_for: an ? morgenTag() : null });
	}

	async function feierabend() {
		speichert = true;
		try {
			await reflexionSpeichern();
			await ritualeState.markiereAbgeschlossen(heute);
			emit('tag.abgeschlossen', { datum: heute, erledigteAufgaben: erledigt.map((t) => t.id) });
			await goto('/');
		} finally {
			speichert = false;
		}
	}

	const weiter = () => (schritt = Math.min(NAMEN.length - 1, schritt + 1));
	const zurueck = () => (schritt = Math.max(0, schritt - 1));
</script>

<svelte:head><title>Tag abschließen - Life OS</title></svelte:head>

<div class="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-4 py-6 pt-safe pb-safe">
	<header class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-3">
			<h1 class="text-3xl font-extrabold [font-stretch:85%]">Tag abschließen</h1>
			<a
				href="/"
				aria-label="Abbrechen"
				class="flex h-12 w-12 shrink-0 items-center justify-center border-[length:var(--rahmen-s)] border-tinte hover:bg-flaeche-2"
			>
				<X size={20} />
			</a>
		</div>
		<Schritte schritte={NAMEN} aktuell={schritt} />
	</header>

	<main class="flex flex-1 flex-col gap-4">
		{#if schritt === 0}
			<h2 class="mono-label">Geschafft</h2>
			{#if erledigt.length === 0}
				<p class="text-text-2">Heute ist noch nichts abgehakt. Das ist in Ordnung.</p>
			{:else}
				<p class="text-text-2">
					{erledigt.length}
					{erledigt.length === 1 ? 'Aufgabe' : 'Aufgaben'} erledigt
					{#if timeTrackingState.totalTodayMin > 0}
						· {formatMinutes(timeTrackingState.totalTodayMin)} fokussiert
					{/if}
				</p>
				<ul class="box m-0 list-none p-0">
					{#each erledigt as t (t.id)}
						<li class="border-b-[length:var(--rahmen-s)] border-tinte px-3 py-2 last:border-b-0">
							{t.title}
						</li>
					{/each}
				</ul>
			{/if}
		{:else if schritt === 1}
			<h2 class="mono-label">Offen</h2>
			{#if offen.length === 0}
				<p class="text-text-2">Alles entschieden. Nichts bleibt offen hängen.</p>
			{:else}
				<div class="flex flex-wrap items-center justify-between gap-2">
					<p class="text-text-2">Was passiert mit dem, was heute offen blieb?</p>
					<Button size="sm" variant="sekundaer" onclick={alleAufMorgen}>Alle auf morgen</Button>
				</div>
				<ul class="box m-0 list-none p-0">
					{#each offen as t (t.id)}
						<AbschlussEntscheidung
							task={t}
							onentschieden={(id) => (entschieden = [...entschieden, id])}
						/>
					{/each}
				</ul>
			{/if}
		{:else if schritt === 2}
			<h2 class="mono-label">Reflexion</h2>
			{#if !istAktiv('mood') && !istAktiv('journal')}
				<p class="text-text-2">Für die Reflexion ist kein passendes Modul eingeschaltet.</p>
			{/if}
			{#if istAktiv('mood')}
				<div class="flex flex-col gap-2" role="group" aria-labelledby="refl-stimmung">
					<p id="refl-stimmung" class="font-semibold">Wie war der Tag?</p>
					<div class="flex flex-wrap gap-2">
						{#each [1, 2, 3, 4, 5] as score (score)}
							<Chip selected={stimmung === score} onclick={() => moodState.save(score, null)}>
								{MOOD_LABELS[score]}
							</Chip>
						{/each}
					</div>
				</div>
			{/if}
			{#if istAktiv('journal')}
				<label class="flex flex-col gap-2">
					<span class="font-semibold">Was lief gut?</span>
					<Input bind:value={gutGelaufen} placeholder="Optional, eine Zeile" />
					<span class="mono-label text-text-3">Landet in deinem privaten Tagebuch.</span>
				</label>
			{/if}
		{:else}
			<h2 class="mono-label">Morgen</h2>
			<p class="text-text-2">
				Bis zu drei Aufgaben für morgen. Gewählt: {gewaehlt}.
			</p>
			{#if vorschlaege.length === 0}
				<p class="text-text-2">Gerade gibt es keinen Vorschlag.</p>
			{:else}
				<ul class="box m-0 list-none p-0">
					{#each vorschlaege as t (t.id)}
						<li
							class="flex items-center justify-between gap-3 border-b-[length:var(--rahmen-s)] border-tinte px-3 py-2 last:border-b-0"
						>
							<span class="min-w-0 flex-1">{t.title}</span>
							<Chip
								selected={t.planned_for === morgenTag()}
								onclick={() => toggleMorgen(t.id, t.planned_for !== morgenTag())}
							>
								Morgen
							</Chip>
						</li>
					{/each}
				</ul>
			{/if}
			<div><Button size="lg" loading={speichert} onclick={feierabend}>Feierabend</Button></div>
		{/if}
	</main>

	<footer
		class="flex flex-wrap items-center justify-between gap-3 border-t-[length:var(--rahmen-s)] border-tinte pt-4"
	>
		<Button variant="ghost" onclick={zurueck} disabled={schritt === 0}>Zurück</Button>
		{#if schritt < NAMEN.length - 1}
			<div class="flex flex-wrap items-center gap-2">
				<Button variant="ghost" onclick={weiter}>Überspringen</Button>
				<Button onclick={weiter}>Weiter</Button>
			</div>
		{/if}
	</footer>
</div>
