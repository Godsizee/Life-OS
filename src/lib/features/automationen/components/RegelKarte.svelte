<script lang="ts">
	import { page } from '$app/state';
	import NumberSetting from '#lib/ui/NumberSetting.svelte';
	import SegmentedControl from '#lib/ui/SegmentedControl.svelte';
	import Select from '#lib/ui/Select.svelte';
	import Switch from '#lib/ui/Switch.svelte';
	import { wirksam } from '../engine.js';
	import {
		leseUeberschreibung,
		loescheUeberschreibung,
		setzeUeberschreibung
	} from '../einstellungen.js';
	import type { Regel, RegelModus } from '../types.js';

	let {
		regel,
		routinen
	}: {
		regel: Regel;
		/** Aktive Routinen zur Auswahl — kommt von der Route, damit das Feature keinen fremden Store importiert. */
		routinen: { id: string; name: string }[];
	} = $props();

	const ueberschreibung = $derived(leseUeberschreibung(regel.id));
	const w = $derived(wirksam(regel, ueberschreibung));
	const veraendert = $derived(Object.keys(ueberschreibung).length > 0);
	const markiert = $derived(page.url.hash === `#${regel.id}`);

	const MODI: { value: RegelModus; label: string }[] = [
		{ value: 'auto', label: 'Automatisch' },
		{ value: 'fragen', label: 'Erst fragen' }
	];

	// Eingabegrenzen sind Sache der Oberfläche, nicht des Regelvertrags.
	const ZAHL_GRENZEN: Record<string, { min: number; max: number; step: number }> = {
		mlProEinheit: { min: 50, max: 2000, step: 50 },
		tage: { min: 1, max: 14, step: 1 }
	};
	const STANDARD_GRENZEN = { min: 1, max: 1000, step: 1 };

	const braucheRoutine = $derived(
		w.aktiv &&
			!!regel.parameterFelder?.some(
				(f) => f.art === 'routine' && typeof w.parameter[f.schluessel] !== 'string'
			)
	);

	const setzeParameter = (schluessel: string, wert: unknown) =>
		setzeUeberschreibung(regel.id, { parameter: { [schluessel]: wert } });
</script>

<article
	id={regel.id}
	class="scroll-mt-20 rounded-xl border bg-surface-0 p-4 shadow-sm {markiert
		? 'border-primary-500 ring-2 ring-primary-500/30'
		: 'border-border-color'}"
>
	<Switch
		label={regel.titel}
		checked={w.aktiv}
		onchange={(an) => setzeUeberschreibung(regel.id, { aktiv: an })}
	/>
	<p class="mt-1 text-xs leading-relaxed text-text-secondary">{regel.erklaerung}</p>

	{#if w.aktiv}
		<div class="mt-3 flex flex-col gap-3">
			<SegmentedControl
				label="Ablauf der Regel {regel.titel}"
				options={MODI}
				value={w.modus}
				onchange={(modus) => setzeUeberschreibung(regel.id, { modus })}
			/>
			<p class="text-xs text-text-tertiary">
				{w.modus === 'auto'
					? 'Wird sofort ausgeführt. Du siehst eine Meldung mit „Rückgängig".'
					: 'Life OS schlägt es vor, du bestätigst mit „Ja".'}
			</p>

			{#each regel.parameterFelder ?? [] as feld (feld.schluessel)}
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-text-primary">{feld.label}</span>
					{#if feld.art === 'routine'}
						<Select
							value={typeof w.parameter[feld.schluessel] === 'string'
								? (w.parameter[feld.schluessel] as string)
								: ''}
							onchange={(e) =>
								setzeParameter(
									feld.schluessel,
									(e.currentTarget as HTMLSelectElement).value || null
								)}
						>
							<option value="">– keine –</option>
							{#each routinen as r (r.id)}
								<option value={r.id}>{r.name}</option>
							{/each}
						</Select>
					{:else if feld.art === 'zahl'}
						<NumberSetting
							value={Number(w.parameter[feld.schluessel] ?? 0)}
							limits={ZAHL_GRENZEN[feld.schluessel] ?? STANDARD_GRENZEN}
							onchange={(v) => setzeParameter(feld.schluessel, v)}
						/>
					{/if}
					{#if feld.hinweis}
						<span class="text-xs text-text-tertiary">{feld.hinweis}</span>
					{/if}
				</label>
			{/each}

			{#if braucheRoutine}
				<p class="text-xs text-amber-700 dark:text-amber-300">
					Ohne Routine passiert bei dieser Regel nichts.
				</p>
			{/if}
		</div>
	{/if}

	{#if veraendert}
		<button
			type="button"
			onclick={() => loescheUeberschreibung(regel.id)}
			class="mt-3 min-h-10 text-xs font-medium text-text-tertiary underline underline-offset-2 hover:text-text-primary"
		>
			Auf Standard zurücksetzen
		</button>
	{/if}
</article>
