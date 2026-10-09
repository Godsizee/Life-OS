<script lang="ts">
	import { Check } from '@lucide/svelte';
	import { rituale } from '#lib/config/heute.js';
	import { toISODate } from '#lib/core/date.js';
	import { setze, wert } from '#lib/core/einstellungen.js';
	import { installState } from '#lib/core/install.svelte.js';
	import { habitsState } from '#lib/features/habits/store.svelte.js';
	import { healthState } from '#lib/features/health/store.svelte.js';
	import { moodState } from '#lib/features/mood/store.svelte.js';
	import { notesState } from '#lib/features/notes/store.svelte.js';
	import { pushState } from '#lib/features/reminders/push.svelte.js';
	import { tasksState } from '#lib/features/tasks/store.svelte.js';
	import { workspaceState } from '#lib/features/workspace/store.svelte.js';
	import { ritualeState } from '#lib/features/dashboard/rituale.svelte.js';
	import Box from '#lib/ui/Box.svelte';
	import Button from '#lib/ui/Button.svelte';
	import { ersteSchritteAus } from '../../einstellungen/hilfe.js';
	import { setupAbgeschlossen, setupAbsichten } from '../../einstellungen/setup.js';
	import { istAktiv } from '../../module-aktiv.svelte.js';
	import { ersteSchritte, setupDatum, zeigeErsteSchritte } from '../../setup-kern.js';

	const datum = $derived(setupDatum(wert(setupAbgeschlossen)));
	const seit = (iso: string) => toISODate(new Date(iso)) >= datum;

	const liste = $derived(
		ersteSchritte({
			setupDatum: datum,
			absichten: wert(setupAbsichten),
			ritualeAn: wert(rituale),
			tagGeplant: ritualeState.rituale.some((r) => !!r.planned_at),
			festgehalten:
				tasksState.tasks.some((t) => seit(t.created_at)) ||
				notesState.notes.some((n) => seit(n.created_at)),
			routinenAktiv: istAktiv('habits'),
			routinen: habitsState.habits.length,
			stimmungAktiv: istAktiv('mood'),
			gesundheitAktiv: istAktiv('health'),
			checkins: moodState.entries.length + healthState.entries.length,
			mitglieder: workspaceState.members.length,
			pushAktiv: pushState.subscribed,
			installiert: installState.installed
		})
	);
	const erledigt = $derived(liste.filter((s) => s.erledigt).length);
</script>

{#if zeigeErsteSchritte(liste, wert(ersteSchritteAus))}
	<Box titel="Erste Schritte · {erledigt} von {liste.length}">
		<ul class="m-0 list-none p-0">
			{#each liste as s (s.id)}
				<li
					class="flex flex-col gap-2 border-b-[length:var(--rahmen-s)] border-tinte px-3 py-3 last:border-b-0"
				>
					<div class="flex items-center gap-3">
						<span
							class="flex h-6 w-6 shrink-0 items-center justify-center border-[length:var(--rahmen-s)] border-tinte {s.erledigt
								? 'bg-tinte text-seite'
								: 'bg-flaeche'}"
							aria-hidden="true"
						>
							{#if s.erledigt}<Check size={16} />{/if}
						</span>
						<span
							class="min-w-0 flex-1 font-semibold {s.erledigt ? 'text-text-3 line-through' : ''}"
						>
							{s.titel}
							<span class="sr-only">{s.erledigt ? ' (erledigt)' : ' (offen)'}</span>
						</span>
					</div>
					{#if !s.erledigt}
						<div class="flex flex-wrap items-center gap-x-4 gap-y-1 pl-9">
							<a href={s.href} class="contents"
								><Button size="sm" variant="sekundaer">{s.aktion}</Button></a
							>
							<a
								href="/hilfe/{s.hilfe}"
								class="mono-label inline-flex min-h-[var(--ziel-min)] items-center underline decoration-2 underline-offset-4"
							>
								Wie geht das?
							</a>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
		<div class="flex justify-end px-3 py-2">
			<Button size="sm" variant="ghost" onclick={() => setze(ersteSchritteAus, true)}>
				Ausblenden
			</Button>
		</div>
	</Box>
{/if}
