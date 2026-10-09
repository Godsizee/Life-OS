import type { Erklaerung } from '#lib/core/modul.js';
import type { ScoreErgebnis } from '#lib/core/score.js';
import { formatMinutes } from '#lib/features/timetracking/stats.js';
import type { Tagesplan } from './agenda.js';

/** Erklärungen für berechnete Zahlen auf Heute. Rein, damit sie sich testen lassen. */

const punkte = (n: number) => `${Math.round(n * 10) / 10}`.replace('.', ',');
const prozent = (anteil: number) => `${Math.round(anteil * 100)} %`;

/** Life Score: je Bereich Wert × Anteil = Beitrag, dazu die Bereiche, die heute nicht zählen. */
export function scoreErklaerung(ergebnis: ScoreErgebnis | null): Erklaerung {
	const steuerung = [
		{ label: 'Gewichte ändern', href: '/settings#score' },
		{ label: 'Alle Einblicke', href: '/analytics' }
	];
	if (!ergebnis || ergebnis.gesamt === null) {
		return {
			was: 'Der Life Score fasst die Bereiche zusammen, in denen für den Tag etwas vorliegt.',
			warumJetzt: 'Heute liegt noch nichts vor, das sich bewerten ließe. Der Score bleibt leer.',
			daten: [],
			staerke: 'Fehlende Einträge zählen nicht gegen dich.',
			steuerung
		};
	}
	const zaehlt = ergebnis.zeilen.filter((z) => z.anteil > 0);
	const aussen = ergebnis.zeilen.filter((z) => z.anteil === 0);
	const daten = [
		...zaehlt.map(
			(z) =>
				`${z.label}: ${Math.round(z.wert ?? 0)} × ${prozent(z.anteil)} = ${punkte(z.beitrag)} Punkte`
		),
		...aussen.map(
			(z) => `${z.label}: zählt heute nicht (${z.gewicht <= 0 ? 'Gewicht 0' : 'kein Eintrag'})`
		)
	];
	return {
		was: 'Der Life Score ist der gewichtete Durchschnitt der Bereiche, in denen heute etwas vorliegt. Die Gewichte der übrigen Bereiche werden neu verteilt.',
		warumJetzt: `Die Beiträge ergeben zusammen ${ergebnis.gesamt} von 100.`,
		daten,
		staerke: 'Ein Bereich ohne Eintrag ist keine schlechte Leistung: Er zählt nicht mit.',
		steuerung
	};
}

/** Kapazitäts-Satz: Fenster, Termine, Schätzungen und Aufgaben mit Standarddauer. */
export function kapazitaetErklaerung(
	plan: Tagesplan,
	fenster: { beginn: string; ende: string },
	standardDauerMin: number
): Erklaerung {
	const k = plan.kapazitaet;
	const offen = [...plan.zeitlich, ...plan.flexibel].filter(
		(e) => e.art === 'aufgabe' && !e.erledigt
	);
	const geschaetzt = offen.filter((e) => e.dauerMin !== null);
	const ohne = offen.length - geschaetzt.length;
	const summeGeschaetzt = geschaetzt.reduce((s, e) => s + (e.dauerMin ?? 0), 0);
	const frei = Math.max(0, k.verfuegbarMin);
	return {
		was: 'Die freie Zeit ist dein Tagesfenster minus die Termine. Geplant ist die Zeit der offenen Aufgaben.',
		warumJetzt: `Geplant ${formatMinutes(k.geplantMin)}, frei ${formatMinutes(frei)}.`,
		daten: [
			`Tagesfenster: ${fenster.beginn} bis ${fenster.ende}`,
			`Termine: ${formatMinutes(k.termineMin)} (überlappende zählen einmal, ganztägige gar nicht)`,
			`Schätzungen: ${formatMinutes(summeGeschaetzt)} aus ${geschaetzt.length} ${geschaetzt.length === 1 ? 'Aufgabe' : 'Aufgaben'}`,
			`Ohne Schätzung: ${ohne} ${ohne === 1 ? 'Aufgabe' : 'Aufgaben'} mit je ${formatMinutes(standardDauerMin)} Standarddauer`
		],
		staerke: k.ueberbucht
			? 'Der Plan ist größer als die freie Zeit. Das ist ein Hinweis, kein Fehler.'
			: undefined,
		steuerung: [{ label: 'Tagesfenster ändern', href: '/settings#heute' }]
	};
}
