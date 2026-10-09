<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { X } from '@lucide/svelte';
	import { tagesbeginn, tagesende } from '#lib/config/heute.js';
	import { toISODate } from '#lib/core/date.js';
	import { wert } from '#lib/core/einstellungen.js';
	import { emit } from '#lib/core/ereignisse.js';
	import { ritualeState } from '#lib/features/dashboard/rituale.svelte.js';
	import { tasksState } from '#lib/features/tasks/store.svelte.js';
	import { formatMinutes } from '#lib/features/timetracking/stats.js';
	import { heuteTagesplan } from '#lib/system/agenda-heute.js';
	import { tagesfenster } from '#lib/system/agenda-kern.js';
	import AbschlussEntscheidung from '#lib/system/components/heute/AbschlussEntscheidung.svelte';
	import { gesternOffen, planKandidaten, vortag } from '#lib/system/ritual-logik.js';
	import Band from '#lib/ui/Band.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Chip from '#lib/ui/Chip.svelte';
	import Input from '#lib/ui/Input.svelte';
	import Schritte from '#lib/ui/Schritte.svelte';
	import Balken from '#lib/ui/Balken.svelte';

	const NAMEN = ['Gestern', 'Auswählen', 'Kapazität', 'Festlegen'];
	const SCHAETZUNGEN = [15, 30, 60, 90];

	const jetzt = new Date();
	const heute = toISODate(jetzt);

	// `?schritt=3` springt direkt zur Kapazität (aus dem Überbuchungs-Band auf Heute).
	const wunsch = Number(page.url.searchParams.get('schritt'));
	let schritt = $state(wunsch >= 1 && wunsch <= NAMEN.length ? wunsch - 1 : 0);

	// ── Schritt 1: Gestern ───────────────────────────────────────────
	// Nur, wenn gestern kein Abschluss stattfand; sonst wurde schon entschieden.
	const gesternAbgeschlossen = $derived(!!ritualeState.fuer(vortag(heute) ?? '')?.closed_at);
	let entschieden = $state<string[]>([]);
	const vonGestern = $derived(
		gesternAbgeschlossen
			? []
			: gesternOffen(tasksState.tasks, jetzt).filter((t) => !entschieden.includes(t.id))
	);

	// ── Schritt 2: Auswählen ─────────────────────────────────────────
	const kandidaten = $derived(planKandidaten(tasksState.tasks, jetzt));

	async function setzeHeute(id: string, an: boolean) {
		const t = tasksState.tasks.find((x) => x.id === id);
		await tasksState.planen(id, {
			planned_for: an ? heute : null,
			estimate_min: t?.estimate_min,
			scheduled_start: an ? t?.scheduled_start : null
		});
	}

	async function setzeSchaetzung(id: string, min: number) {
		const t = tasksState.tasks.find((x) => x.id === id);
		await tasksState.planen(id, {
			planned_for: t?.planned_for ?? null,
			estimate_min: t?.estimate_min === min ? null : min,
			scheduled_start: t?.scheduled_start
		});
	}

	async function setzeUhrzeit(id: string, hhmm: string) {
		const t = tasksState.tasks.find((x) => x.id === id);
		if (!t?.planned_for) return;
		const [h, m] = hhmm.split(':').map(Number);
		const start = hhmm
			? new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate(), h, m).toISOString()
			: null;
		await tasksState.planen(id, {
			planned_for: t.planned_for,
			estimate_min: t.estimate_min,
			scheduled_start: start
		});
	}

	const uhrzeitVon = (iso: string | null) =>
		iso
			? `${String(new Date(iso).getHours()).padStart(2, '0')}:${String(new Date(iso).getMinutes()).padStart(2, '0')}`
			: '';

	// ── Schritt 3: Kapazität ─────────────────────────────────────────
	let beginn = $state(wert(tagesbeginn));
	let ende = $state(wert(tagesende));
	const plan = $derived(heuteTagesplan(jetzt, tagesfenster(jetzt, beginn, ende)));
	const kap = $derived(plan.kapazitaet);
	const ueberMin = $derived(kap.ueberbucht ? kap.geplantMin - kap.verfuegbarMin : 0);
	const heuteGeplant = $derived(
		tasksState.tasks.filter(
			(t) => t.planned_for === heute && t.status !== 'done' && t.status !== 'dropped'
		)
	);

	// ── Schritt 4: Festlegen ─────────────────────────────────────────
	let absicht = $state('');
	let speichert = $state(false);

	async function festlegen() {
		speichert = true;
		try {
			await ritualeState.markiereGeplant(heute, {
				capacity_min: kap.verfuegbarMin,
				intention: absicht.trim() || null
			});
			emit('tag.geplant', {
				datum: heute,
				geplantMin: kap.geplantMin,
				verfuegbarMin: kap.verfuegbarMin
			});
			await goto('/');
		} finally {
			speichert = false;
		}
	}

	const weiter = () => (schritt = Math.min(NAMEN.length - 1, schritt + 1));
	const zurueck = () => (schritt = Math.max(0, schritt - 1));
</script>

<svelte:head><title>Tag planen - Life OS</title></svelte:head>

<div class="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-4 py-6 pt-safe pb-safe">
	<header class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-3">
			<h1 class="text-3xl font-extrabold [font-stretch:85%]">Tag planen</h1>
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
			<h2 class="mono-label">Gestern</h2>
			{#if vonGestern.length === 0}
				<p class="text-text-2">Von gestern ist nichts offen.</p>
			{:else}
				<p class="text-text-2">Was ist mit diesen Aufgaben von gestern?</p>
				<ul class="box m-0 list-none p-0">
					{#each vonGestern as t (t.id)}
						<AbschlussEntscheidung
							task={t}
							kompakt
							onentschieden={(id) => (entschieden = [...entschieden, id])}
						/>
					{/each}
				</ul>
			{/if}
		{:else if schritt === 1}
			<h2 class="mono-label">Auswählen</h2>
			{#if kandidaten.length === 0}
				<p class="text-text-2">
					Gerade gibt es keine Aufgabe, die sich aufdrängt. Du kannst sofort weiter.
				</p>
			{:else}
				<ul class="box m-0 list-none p-0">
					{#each kandidaten as k (k.task.id)}
						{@const heutig = k.task.planned_for === heute}
						<li
							class="flex flex-col gap-2 border-b-[length:var(--rahmen-s)] border-tinte px-3 py-3 last:border-b-0"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="font-semibold">{k.task.title}</p>
									<p class="mono-label text-text-3">{k.text}</p>
								</div>
								<Chip selected={heutig} onclick={() => setzeHeute(k.task.id, !heutig)}>Heute</Chip>
							</div>
							{#if heutig}
								<div class="flex flex-wrap items-center gap-2">
									{#each SCHAETZUNGEN as min (min)}
										<Chip
											selected={k.task.estimate_min === min}
											onclick={() => setzeSchaetzung(k.task.id, min)}
										>
											{min}
										</Chip>
									{/each}
									<label class="mono-label ml-auto flex items-center gap-2">
										um
										<input
											type="time"
											value={uhrzeitVon(k.task.scheduled_start)}
											onchange={(e) => setzeUhrzeit(k.task.id, e.currentTarget.value)}
											class="min-h-[var(--ziel-min)] border-[length:var(--rahmen-s)] border-tinte bg-flaeche px-2 text-base"
										/>
									</label>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		{:else if schritt === 2}
			<h2 class="mono-label">Kapazität</h2>
			<div class="flex flex-wrap items-center gap-3">
				<label class="mono-label flex items-center gap-2">
					von
					<input
						type="time"
						bind:value={beginn}
						class="min-h-[var(--ziel-min)] border-[length:var(--rahmen-s)] border-tinte bg-flaeche px-2 text-base"
					/>
				</label>
				<label class="mono-label flex items-center gap-2">
					bis
					<input
						type="time"
						bind:value={ende}
						class="min-h-[var(--ziel-min)] border-[length:var(--rahmen-s)] border-tinte bg-flaeche px-2 text-base"
					/>
				</label>
			</div>
			<Balken
				wert={kap.geplantMin}
				max={Math.max(kap.verfuegbarMin, kap.geplantMin, 1)}
				label="Geplante Zeit gegenüber freier Zeit"
				text={kap.satz}
			/>
			<p class="mono-label text-text-3">Termine: {formatMinutes(kap.termineMin)}</p>
			{#if ueberMin > 0}
				<Band variante="update">
					Dein Plan übersteigt die freie Zeit um {formatMinutes(ueberMin)}. Was kann warten?
				</Band>
				<ul class="box m-0 list-none p-0">
					{#each heuteGeplant as t (t.id)}
						<AbschlussEntscheidung task={t} kompakt onentschieden={() => {}} />
					{/each}
				</ul>
			{/if}
		{:else}
			<h2 class="mono-label">Festlegen</h2>
			<label class="flex flex-col gap-2">
				<span class="font-semibold">Worauf kommt es heute an?</span>
				<Input bind:value={absicht} placeholder="Optional, eine Zeile" />
			</label>
			<p class="mono-label text-text-3">{kap.satz}</p>
			<div><Button size="lg" loading={speichert} onclick={festlegen}>Tag festlegen</Button></div>
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
