<script lang="ts">
	import { toISODate } from '#lib/core/date.js';
	import { toastState } from '#lib/core/toast.svelte.js';
	import type { Task } from '#lib/features/tasks/types.js';
	import Button from '#lib/ui/Button.svelte';
	import Chip from '#lib/ui/Chip.svelte';
	import Menue from '#lib/ui/Menue.svelte';
	import MenueEintrag from '#lib/ui/MenueEintrag.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';
	import { ZIEL_LABEL, wandleUm, type Ziel } from '../umwandeln.js';

	let { task, onfertig }: { task: Task; onfertig?: () => void } = $props();

	const DAUERN = [30, 60, 90, 120];

	let terminOffen = $state(false);
	let datum = $state(toISODate(new Date()));
	let uhrzeit = $state('09:00');
	let dauer = $state(60);
	let arbeitet = $state(false);

	// Sofort umwandelbare Ziele; der Termin braucht erst Datum und Uhrzeit.
	const direkt: Ziel[] = ['notiz', 'einkauf', 'routine', 'ziel'];

	async function umwandeln(ziel: Ziel, termin?: { start: string; ende: string }) {
		arbeitet = true;
		try {
			await wandleUm(task.id, ziel, termin);
			onfertig?.();
		} catch (fehler) {
			console.error('[umwandeln] fehlgeschlagen', fehler);
			toastState.error('Das Umwandeln hat nicht geklappt. Die Aufgabe bleibt unverändert.');
		} finally {
			arbeitet = false;
		}
	}

	function oeffneTermin() {
		datum = task.planned_for ?? (task.due_at ? toISODate(new Date(task.due_at)) : datum);
		terminOffen = true;
	}

	async function terminAnlegen() {
		const [j, m, t] = datum.split('-').map(Number);
		const [h, min] = uhrzeit.split(':').map(Number);
		const start = new Date(j, m - 1, t, h, min);
		const ende = new Date(start.getTime() + dauer * 60_000);
		terminOffen = false;
		await umwandeln('termin', { start: start.toISOString(), ende: ende.toISOString() });
	}
</script>

<Menue label="Aufgabe umwandeln in …" ausrichtung="start">
	{#snippet trigger()}<span class="mono-label">Umwandeln in …</span>{/snippet}
	{#each direkt as ziel (ziel)}
		<MenueEintrag onclick={() => umwandeln(ziel)} disabled={arbeitet}
			>{ZIEL_LABEL[ziel]}</MenueEintrag
		>
	{/each}
	<MenueEintrag onclick={oeffneTermin} disabled={arbeitet}>{ZIEL_LABEL.termin}</MenueEintrag>
</Menue>

<Sheet bind:open={terminOffen} title="Termin anlegen" variante="blatt">
	<form
		class="flex flex-col gap-4 p-4"
		onsubmit={(e) => {
			e.preventDefault();
			void terminAnlegen();
		}}
	>
		<p class="font-semibold">{task.title}</p>
		<div class="flex flex-wrap gap-4">
			<label class="mono-label flex flex-col gap-1">
				Datum
				<input
					type="date"
					bind:value={datum}
					required
					class="min-h-[var(--ziel-min)] border-[length:var(--rahmen-s)] border-tinte bg-flaeche px-2 text-base"
				/>
			</label>
			<label class="mono-label flex flex-col gap-1">
				Uhrzeit
				<input
					type="time"
					bind:value={uhrzeit}
					required
					class="min-h-[var(--ziel-min)] border-[length:var(--rahmen-s)] border-tinte bg-flaeche px-2 text-base"
				/>
			</label>
		</div>
		<div class="flex flex-col gap-2" role="group" aria-labelledby="umw-dauer">
			<p id="umw-dauer" class="mono-label">Dauer (Minuten)</p>
			<div class="flex flex-wrap gap-2">
				{#each DAUERN as min (min)}
					<Chip selected={dauer === min} onclick={() => (dauer = min)}>{min}</Chip>
				{/each}
			</div>
		</div>
		<div><Button type="submit" loading={arbeitet}>Termin anlegen</Button></div>
	</form>
</Sheet>
