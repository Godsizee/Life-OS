<script lang="ts">
	import { fromISODate, formatTagKurz, toISODate } from '#lib/core/date.js';
	import { isDueOn, isSkipped, isCompleted, type HabitDay } from '#lib/features/habits/streak.js';
	import type { Habit } from '#lib/features/habits/types.js';
	import Raster from '#lib/ui/charts/Raster.svelte';
	import { monatsLabels, type RasterZelle } from '#lib/ui/charts/raster-kern.js';

	let {
		habits,
		entriesFor,
		weeks = 12
	}: {
		habits: Habit[];
		entriesFor: (habitId: string) => HabitDay[];
		weeks?: number;
	} = $props();

	const heute = new Date();
	const heuteIso = toISODate(heute);

	// Die letzten `weeks` * 7 Tage, heute zuletzt; je 7 Tage = 1 Spalte.
	const tage = $derived(
		Array.from({ length: weeks * 7 }, (_, i) => {
			const d = new Date(heute);
			d.setDate(heute.getDate() - weeks * 7 + 1 + i);
			return toISODate(d);
		})
	);
	const wochen = $derived(Array.from({ length: weeks }, (_, w) => tage.slice(w * 7, w * 7 + 7)));

	// Pro Tag: wie viele Routinen waren fällig und wie viele davon erledigt.
	function zaehle(tag: string): { due: number; logged: number } {
		const datum = fromISODate(tag) ?? new Date(tag);
		let due = 0;
		let logged = 0;
		for (const h of habits) {
			const day = entriesFor(h.id).find((d) => d.date === tag);
			if (isSkipped(day)) continue;
			if (h.schedule.type === 'weekly_count' || isDueOn(h.schedule, datum)) {
				due++;
				if (isCompleted(h, day)) logged++;
			}
		}
		return { due, logged };
	}

	// Stufen in der Modulfarbe der Routinen: je mehr erledigt, desto kräftiger.
	const STUFEN = [
		{ text: 'Nichts erledigt', farbe: 'var(--flaeche)' },
		{ text: 'Unter 50 %', farbe: 'color-mix(in srgb, var(--mod-habits) 30%, var(--flaeche))' },
		{ text: '50 bis 79 %', farbe: 'color-mix(in srgb, var(--mod-habits) 60%, var(--flaeche))' },
		{ text: 'Ab 80 %', farbe: 'var(--mod-habits)' }
	];
	function farbeFuer(due: number, logged: number): string | null {
		if (due === 0) return null;
		const pct = Math.round((logged / due) * 100);
		if (pct === 0) return STUFEN[0].farbe;
		if (pct < 50) return STUFEN[1].farbe;
		if (pct < 80) return STUFEN[2].farbe;
		return STUFEN[3].farbe;
	}

	const zellen = $derived<RasterZelle[]>(
		tage.map((tag, i) => {
			const { due, logged } = zaehle(tag);
			const datum = fromISODate(tag);
			return {
				id: tag,
				spalte: Math.floor(i / 7),
				zeile: i % 7,
				farbe: farbeFuer(due, logged),
				label: datum ? formatTagKurz(datum) : tag,
				text: due > 0 ? `${logged} von ${due} Routinen erledigt` : 'keine Routine fällig',
				heute: tag === heuteIso
			};
		})
	);

	const erledigteTage = $derived(
		zellen.filter((z) => z.farbe !== null && z.farbe !== STUFEN[0].farbe).length
	);
</script>

<Raster
	spalten={weeks}
	zeilen={7}
	{zellen}
	spaltenLabels={monatsLabels(wochen)}
	beschreibung="Erledigte Routinen der letzten {weeks} Wochen: an {erledigteTage} Tagen mindestens eine"
	legende={[{ farbe: null, text: 'Nichts fällig' }, ...STUFEN]}
	tabellenKopf={['Tag', 'Erledigt']}
/>
