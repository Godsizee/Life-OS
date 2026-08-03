<script lang="ts">
	// Zeigt, was endgueltig nicht gespeichert werden konnte.
	//
	// Vorher konnte das Banner nur "Verwerfen": der Nutzer erfuhr nie, WAS verloren
	// ging, und der lokale Zustand blieb danach falsch — eine optimistisch
	// angezeigte Zeile, die es serverseitig nie gab, blieb bis zum naechsten Reload
	// stehen. Deshalb hier beides: die Liste und ein Abgleich mit dem Server.
	import { AlertTriangle, CheckCircle2 } from 'lucide-svelte';
	import { outbox } from '$lib/core/outbox.svelte';
	import { abgleichJetzt } from '$lib/core/resync';
	import { toastState } from '$lib/core/toast.svelte';
	import Badge from './Badge.svelte';
	import Button from './Button.svelte';
	import EmptyState from './EmptyState.svelte';
	import Sheet from './Sheet.svelte';
	import Spinner from './Spinner.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	interface Eintrag {
		table: string;
		operation: 'insert' | 'update' | 'delete';
		createdAt: string;
		lastError?: string;
	}

	let eintraege = $state<Eintrag[]>([]);
	let laedt = $state(false);
	let raeumtAuf = $state(false);

	$effect(() => {
		if (!open) return;
		laedt = true;
		outbox
			.getDead()
			.then((d) => (eintraege = d as Eintrag[]))
			.catch(() => (eintraege = []))
			.finally(() => (laedt = false));
	});

	// Tabellennamen sind ein Implementierungsdetail — im Fehlerdialog braucht der
	// Nutzer den Modulnamen, den er aus der Navigation kennt.
	const MODUL: Record<string, string> = {
		tasks: 'Aufgaben',
		projects: 'Projekte',
		notes: 'Notizen',
		habits: 'Routinen',
		habit_logs: 'Routinen-Eintrag',
		events: 'Termine',
		calendars: 'Kalender',
		event_overrides: 'Termin-Ausnahme',
		shopping_items: 'Einkauf',
		goals: 'Ziele',
		goal_checkins: 'Ziel-Check-in',
		journal_entries: 'Tagebuch',
		mood_entries: 'Stimmung',
		health_entries: 'Gesundheit',
		time_entries: 'Zeiterfassung',
		reminders: 'Erinnerungen',
		attachments: 'Anhänge',
		entity_links: 'Verknüpfungen',
		workout_plans: 'Trainingspläne',
		workout_logs: 'Trainings',
		workout_exercises: 'Übungen',
		exercise_catalog: 'Übungskatalog',
		profiles: 'Einstellungen'
	};

	const AKTION: Record<Eintrag['operation'], string> = {
		insert: 'Anlegen',
		update: 'Ändern',
		delete: 'Löschen'
	};

	function zeitpunkt(iso: string): string {
		return new Date(iso).toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function verwerfenUndNeuladen() {
		raeumtAuf = true;
		try {
			await outbox.clearDead();
			// Erst nach dem Leeren abgleichen: sonst zeigt die Oberflaeche weiter
			// Zeilen an, die es serverseitig nie gab.
			await abgleichJetzt();
			eintraege = [];
			open = false;
			toastState.success('Verworfen — Daten wurden neu geladen');
		} catch {
			toastState.error('Neu laden fehlgeschlagen');
		} finally {
			raeumtAuf = false;
		}
	}
</script>

<Sheet bind:open title="Nicht gespeicherte Änderungen">
	<div class="flex flex-col gap-4 px-4 pb-6">
		{#if laedt}
			<div class="flex justify-center py-8"><Spinner /></div>
		{:else if eintraege.length === 0}
			<EmptyState
				icon={CheckCircle2}
				size="sm"
				title="Nichts offen"
				hint="Alle Änderungen sind gespeichert."
			/>
		{:else}
			<p class="text-sm text-text-secondary">
				Diese Änderungen konnten nicht gespeichert werden und werden nicht erneut versucht.
				Beim Verwerfen wird der aktuelle Stand vom Server geladen.
			</p>

			<ul class="flex flex-col gap-2">
				{#each eintraege as eintrag, i (`${eintrag.createdAt}-${i}`)}
					<li class="rounded-xl border border-border-color bg-surface-1 p-3">
						<div class="flex flex-wrap items-center gap-2">
							<AlertTriangle size={16} class="shrink-0 text-amber-500" />
							<span class="text-sm font-medium text-text-primary">
								{MODUL[eintrag.table] ?? eintrag.table}
							</span>
							<Badge variant="warning">{AKTION[eintrag.operation]}</Badge>
							<span class="ml-auto text-xs text-text-tertiary">{zeitpunkt(eintrag.createdAt)}</span>
						</div>
						{#if eintrag.lastError}
							<p class="mt-1.5 break-words text-xs text-text-tertiary">{eintrag.lastError}</p>
						{/if}
					</li>
				{/each}
			</ul>

			<Button variant="danger" fullWidth loading={raeumtAuf} onclick={verwerfenUndNeuladen}>
				Verwerfen und neu laden
			</Button>
		{/if}
	</div>
</Sheet>
