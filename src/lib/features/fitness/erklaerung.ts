import type { Erklaerung } from '#lib/core/modul.js';

const kg = (n: number) => `${n}`.replace('.', ',');

/** „Warum dieses 1RM?“: Formel (Epley) und der Satz, aus dem der Wert stammt. */
export function einRmErklaerung(satz: {
	weight_kg: number;
	reps: number;
	est_1rm: number;
}): Erklaerung {
	const rechnung =
		satz.reps === 1
			? `${kg(satz.weight_kg)} kg bei 1 Wiederholung: Das Gewicht gilt selbst als Maximum.`
			: `${kg(satz.weight_kg)} kg × (1 + ${satz.reps} / 30) = ${kg(satz.est_1rm)} kg`;
	return {
		was: 'Das geschätzte 1RM ist das Gewicht, das du für genau eine Wiederholung schaffen könntest. Life OS schätzt es aus deinem besten Satz.',
		warumJetzt: `Dein bester Satz ergibt ${kg(satz.est_1rm)} kg.`,
		daten: [
			`Satz: ${kg(satz.weight_kg)} kg × ${satz.reps}`,
			`Formel (Epley): Gewicht × (1 + Wiederholungen / 30)`,
			`Rechnung: ${rechnung}`,
			'Es zählen erledigte Arbeitssätze mit Gewicht. Aufwärmsätze zählen nicht.'
		],
		staerke: 'Eine Schätzung: Je mehr Wiederholungen der Satz hat, desto ungenauer wird sie.',
		steuerung: []
	};
}
