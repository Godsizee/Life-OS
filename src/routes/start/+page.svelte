<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Check, X } from '@lucide/svelte';
	import { rituale, tagesbeginn, tagesende } from '#lib/config/heute.js';
	import { modules, type ModulId, type SetupAbsicht } from '#lib/config/modules.js';
	import { toISODate } from '#lib/core/date.js';
	import { setze, wert } from '#lib/core/einstellungen.js';
	import { authState } from '#lib/core/auth.svelte.js';
	import { habitsState } from '#lib/features/habits/store.svelte.js';
	import { profileState } from '#lib/features/profile/store.svelte.js';
	import { workspaceState } from '#lib/features/workspace/store.svelte.js';
	import { hilfeNiveau, type HilfeNiveau } from '#lib/system/einstellungen/hilfe.js';
	import { setupAbgeschlossen, setupAbsichten } from '#lib/system/einstellungen/setup.js';
	import { istAktiv, setzeAktiv } from '#lib/system/module-aktiv.svelte.js';
	import {
		ABSICHTEN,
		ROUTINEN_VORLAGEN,
		fragenFuer,
		vorschauModule,
		type FrageId
	} from '#lib/system/setup-kern.js';
	import Alert from '#lib/ui/Alert.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Input from '#lib/ui/Input.svelte';
	import Schritte from '#lib/ui/Schritte.svelte';
	import Switch from '#lib/ui/Switch.svelte';

	// `?ansehen=1`: Der Assistent läuft mit den aktuellen Werten und ändert „Einrichtung abgeschlossen“ nicht.
	const ansehen = page.url.searchParams.get('ansehen') === '1';

	let schritt = $state(0);
	let absichten = $state<SetupAbsicht[]>(ansehen ? [...wert(setupAbsichten)] : []);
	let gewaehlt = $state<ModulId[]>([]);
	let niveau = $state<HilfeNiveau>(wert(hilfeNiveau));
	let beginn = $state(wert(tagesbeginn));
	let ende = $state(wert(tagesende));
	let ritualeAn = $state(wert(rituale));
	let vorlage = $state<string | null>(null);
	let mail = $state('');
	let einladung = $state<'offen' | 'sendet' | 'gesendet' | 'fehler'>('offen');
	let wochenziel = $state(profileState.weeklyWorkoutGoal);
	let fragenAus = $state(false);
	let speichert = $state(false);
	let fehler = $state('');

	const fragen = $derived<FrageId[]>(fragenFuer(absichten));
	const namen = $derived([
		'Ziele',
		'Module',
		...(fragen.length > 0 ? ['Fragen'] : []),
		'Erklärung',
		'Fertig'
	]);
	const aktuell = $derived(namen[schritt]);
	const schaltbar = modules.filter((m) => !m.pflicht);
	const fensterOk = $derived(beginn < ende);

	function wechsleAbsicht(id: SetupAbsicht) {
		absichten = absichten.includes(id) ? absichten.filter((a) => a !== id) : [...absichten, id];
	}

	const aktiveJetzt = () => schaltbar.filter((m) => istAktiv(m.id)).map((m) => m.id);

	function weiter() {
		// Beim Wechsel von „Ziele“ zu „Module“ aus den Absichten (neu) vorschlagen.
		if (aktuell === 'Ziele') {
			gewaehlt =
				ansehen && absichten.length === 0
					? aktiveJetzt()
					: vorschauModule(absichten, modules).filter((id) => schaltbar.some((m) => m.id === id));
		}
		schritt += 1;
	}

	/** „Überspringen“ lässt den Schritt beim Stand von jetzt: nichts davon wird angewendet. */
	function schrittUeberspringen() {
		if (aktuell === 'Module') gewaehlt = aktiveJetzt();
		else if (aktuell === 'Fragen') fragenAus = true;
		else if (aktuell === 'Erklärung') niveau = wert(hilfeNiveau);
		schritt += 1;
	}

	const zurueck = () => (schritt = Math.max(0, schritt - 1));

	function wechsleModul(id: ModulId, an: boolean) {
		gewaehlt = an ? [...gewaehlt, id] : gewaehlt.filter((m) => m !== id);
	}

	async function einladen(event: SubmitEvent) {
		event.preventDefault();
		einladung = 'sendet';
		try {
			await workspaceState.invite(mail);
			mail = '';
			einladung = 'gesendet';
		} catch {
			einladung = 'fehler';
		}
	}

	async function fertig() {
		fehler = '';
		speichert = true;
		try {
			for (const m of schaltbar) {
				const soll = gewaehlt.includes(m.id);
				if (istAktiv(m.id) !== soll) await setzeAktiv(m.id, soll);
			}
			await setze(setupAbsichten, absichten);
			await setze(hilfeNiveau, niveau);
			if (!fragenAus) {
				if (fragen.includes('tagesfenster') && fensterOk) {
					await setze(tagesbeginn, beginn);
					await setze(tagesende, ende);
					await setze(rituale, ritualeAn);
				}
				const v = ROUTINEN_VORLAGEN.find((x) => x.id === vorlage);
				if (fragen.includes('routine') && v && istAktiv('habits')) {
					await habitsState.addHabit({
						name: v.name,
						target_value: v.ziel?.menge ?? null,
						unit: v.ziel?.einheit ?? null
					});
				}
				if (fragen.includes('fitness')) await profileState.setWeeklyWorkoutGoal(wochenziel);
			}
			if (!ansehen) await setze(setupAbgeschlossen, toISODate(new Date()));
			await goto('/');
		} catch {
			fehler = 'Das hat nicht geklappt. Prüfe die Verbindung und versuche es noch einmal.';
			speichert = false;
		}
	}

	/** Alles beim Standard lassen: Die Einrichtung gilt als erledigt, die Module bleiben, wie sie sind. */
	async function ueberspringen() {
		if (!ansehen) await setze(setupAbgeschlossen, toISODate(new Date()));
		await goto('/');
	}

	const NIVEAUS: { id: HilfeNiveau; label: string; beispiel: string }[] = [
		{
			id: 'ausfuehrlich',
			label: 'Ausführlich',
			beispiel: 'Unter Überschriften steht eine Zeile, die erklärt, was du siehst.'
		},
		{
			id: 'standard',
			label: 'Standard',
			beispiel: 'Neben Begriffen steht ein ⓘ. Antippen erklärt den Begriff.'
		},
		{
			id: 'knapp',
			label: 'Knapp',
			beispiel: 'Keine Einführungen. Die Tastenkürzel bleiben sichtbar.'
		}
	];

	const name = $derived(
		profileState.displayName?.trim() || authState.user?.email?.split('@')[0] || ''
	);
</script>

<svelte:head><title>Einrichten - Life OS</title></svelte:head>

<div class="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-4 py-6 pt-safe pb-safe">
	<header class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-3">
			<h1 class="text-3xl font-extrabold [font-stretch:85%]">
				{ansehen ? 'Einrichtung ansehen' : name ? `Willkommen, ${name}` : 'Willkommen'}
			</h1>
			{#if ansehen}
				<a
					href="/"
					aria-label="Schließen"
					class="flex h-12 w-12 shrink-0 items-center justify-center border-[length:var(--rahmen-s)] border-tinte hover:bg-flaeche-2"
				>
					<X size={20} />
				</a>
			{:else}
				<Button variant="ghost" onclick={ueberspringen}>Überspringen</Button>
			{/if}
		</div>
		<Schritte schritte={namen} aktuell={schritt} />
	</header>

	<main class="flex flex-1 flex-col gap-4">
		{#if aktuell === 'Ziele'}
			<h2 class="mono-label">Wobei soll Life OS helfen?</h2>
			<p class="text-text-2">Wähle, was auf dich zutrifft. Du kannst mehrere wählen.</p>
			<ul class="m-0 flex list-none flex-col gap-3 p-0">
				{#each ABSICHTEN as a (a.id)}
					{@const an = absichten.includes(a.id)}
					<li>
						<button
							type="button"
							aria-pressed={an}
							onclick={() => wechsleAbsicht(a.id)}
							class="box druckbar flex w-full items-stretch text-left {an ? 'bg-flaeche-2' : ''}"
						>
							<span
								class="w-3 shrink-0 border-r-[length:var(--rahmen-s)] border-tinte"
								style:background-color="var(--mod-{a.modul})"
								aria-hidden="true"
							></span>
							<span class="flex min-w-0 flex-1 flex-col gap-1 p-3">
								<span class="font-bold">{a.label}</span>
								<span class="text-sm text-text-2">{a.kurz}</span>
							</span>
							<span class="flex w-12 shrink-0 items-center justify-center" aria-hidden="true">
								{#if an}<Check size={22} />{/if}
							</span>
						</button>
					</li>
				{/each}
			</ul>
			<button
				type="button"
				class="mono-label self-start underline decoration-2 underline-offset-4"
				onclick={() => {
					absichten = [];
					weiter();
				}}
			>
				Später entscheiden
			</button>
		{:else if aktuell === 'Module'}
			<h2 class="mono-label">Das schalten wir ein</h2>
			<p class="text-text-2">Jederzeit änderbar unter Einstellungen → Module.</p>
			<ul class="box m-0 list-none p-0">
				{#each schaltbar as m (m.id)}
					<li
						class="flex items-start gap-3 border-b-[length:var(--rahmen-s)] border-tinte px-3 py-2 last:border-b-0"
					>
						<span
							class="mt-2 h-3 w-3 shrink-0 border-[length:var(--rahmen-s)] border-tinte"
							style:background-color="var(--mod-{m.id})"
							aria-hidden="true"
						></span>
						<div class="min-w-0 flex-1">
							<p class="font-semibold">{m.label}</p>
							<p class="text-sm text-text-2">{m.kurz}</p>
						</div>
						<Switch
							checked={gewaehlt.includes(m.id)}
							label={m.label}
							labelVersteckt
							onchange={(an) => wechsleModul(m.id, an)}
						/>
					</li>
				{/each}
			</ul>
		{:else if aktuell === 'Fragen'}
			<h2 class="mono-label">Noch ein paar Fragen</h2>
			{#if fragen.includes('tagesfenster')}
				<section class="flex flex-col gap-3">
					<h3 class="font-bold">Wann beginnt und endet dein Tag?</h3>
					<div class="flex flex-wrap items-center gap-3">
						<label class="mono-label flex items-center gap-2">
							von
							<Input type="time" bind:value={beginn} class="w-auto" />
						</label>
						<label class="mono-label flex items-center gap-2">
							bis
							<Input type="time" bind:value={ende} class="w-auto" />
						</label>
					</div>
					{#if !fensterOk}
						<p class="text-sm text-gefahr" role="alert">Das Ende muss nach dem Beginn liegen.</p>
					{/if}
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="font-semibold">Tag planen und abschließen anbieten</p>
							<p class="text-sm text-text-2">
								Zwei kurze Rituale am Morgen und am Abend. Du kannst sie jederzeit abschalten.
							</p>
						</div>
						<Switch
							bind:checked={ritualeAn}
							label="Tag planen und abschließen anbieten"
							labelVersteckt
						/>
					</div>
				</section>
			{/if}
			{#if fragen.includes('routine')}
				<section class="flex flex-col gap-3">
					<h3 class="font-bold">Mit welcher Routine möchtest du beginnen?</h3>
					<div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Erste Routine">
						{#each ROUTINEN_VORLAGEN as v (v.id)}
							<button
								type="button"
								role="radio"
								aria-checked={vorlage === v.id}
								onclick={() => (vorlage = vorlage === v.id ? null : v.id)}
								class="mono-label min-h-[var(--ziel-min)] border-[length:var(--rahmen-s)] border-tinte px-3 {vorlage ===
								v.id
									? 'bg-tinte text-seite'
									: 'bg-flaeche hover:bg-flaeche-2'}"
							>
								{v.name}
							</button>
						{/each}
					</div>
					<p class="text-sm text-text-2">Optional. Du kannst später eigene anlegen.</p>
				</section>
			{/if}
			{#if fragen.includes('haushalt')}
				<section class="flex flex-col gap-3">
					<h3 class="font-bold">Möchtest du jemanden einladen?</h3>
					<form class="flex flex-wrap items-end gap-2" onsubmit={einladen}>
						<div class="min-w-0 flex-1">
							<Input
								type="email"
								bind:value={mail}
								placeholder="partner@email.de"
								aria-label="E-Mail-Adresse"
								required
							/>
						</div>
						<Button type="submit" variant="sekundaer" disabled={einladung === 'sendet'}>
							Einladung erstellen
						</Button>
					</form>
					{#if einladung === 'gesendet'}
						<p class="flex items-center gap-2 text-sm font-semibold" role="status">
							<Check size={16} aria-hidden="true" /> Einladung erstellt.
						</p>
					{:else if einladung === 'fehler'}
						<p class="text-sm text-gefahr" role="alert">
							Die Einladung konnte nicht erstellt werden. Du kannst es später in den Einstellungen
							erneut versuchen.
						</p>
					{/if}
					<p class="text-sm text-text-2">Optional. Was der Haushalt sieht, steht unter Hilfe.</p>
				</section>
			{/if}
			{#if fragen.includes('fitness')}
				<section class="flex flex-col gap-3">
					<h3 class="font-bold">Wie oft pro Woche möchtest du trainieren?</h3>
					<div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Trainings pro Woche">
						{#each [1, 2, 3, 4, 5, 6] as n (n)}
							<button
								type="button"
								role="radio"
								aria-checked={wochenziel === n}
								onclick={() => (wochenziel = n)}
								class="mono-label nums-tabular min-h-[var(--ziel-min)] min-w-12 border-[length:var(--rahmen-s)] border-tinte px-3 {wochenziel ===
								n
									? 'bg-tinte text-seite'
									: 'bg-flaeche hover:bg-flaeche-2'}"
							>
								{n}×
							</button>
						{/each}
					</div>
				</section>
			{/if}
		{:else if aktuell === 'Erklärung'}
			<h2 class="mono-label">Wie viel Erklärung?</h2>
			<ul class="m-0 flex list-none flex-col gap-3 p-0" role="radiogroup" aria-label="Erklärtiefe">
				{#each NIVEAUS as n (n.id)}
					<li>
						<button
							type="button"
							role="radio"
							aria-checked={niveau === n.id}
							onclick={() => (niveau = n.id)}
							class="box druckbar flex w-full flex-col gap-1 p-3 text-left {niveau === n.id
								? 'bg-flaeche-2'
								: ''}"
						>
							<span class="flex items-center justify-between gap-2 font-bold">
								{n.label}
								{#if niveau === n.id}<Check size={20} aria-hidden="true" />{/if}
							</span>
							<span class="text-sm text-text-2">{n.beispiel}</span>
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<h2 class="mono-label">Fertig</h2>
			<p class="text-text-2">
				{gewaehlt.length > 0 ? `${gewaehlt.length} Module sind eingeschaltet. ` : ''}Alles lässt
				sich in den Einstellungen ändern.
			</p>
			{#if fehler}
				<Alert variant="error">{#snippet children()}{fehler}{/snippet}</Alert>
			{/if}
		{/if}
	</main>

	<footer class="flex flex-wrap items-center justify-between gap-3">
		<Button variant="sekundaer" onclick={zurueck} disabled={schritt === 0}>Zurück</Button>
		{#if aktuell === 'Fertig'}
			<Button onclick={fertig} loading={speichert}>
				{ansehen ? 'Übernehmen' : 'Los geht’s'}
			</Button>
		{:else}
			<div class="flex items-center gap-2">
				{#if aktuell !== 'Ziele'}
					<Button variant="ghost" onclick={schrittUeberspringen}>Überspringen</Button>
				{/if}
				<Button
					onclick={weiter}
					disabled={aktuell === 'Fragen' && fragen.includes('tagesfenster') && !fensterOk}
				>
					Weiter
				</Button>
			</div>
		{/if}
	</footer>
</div>
