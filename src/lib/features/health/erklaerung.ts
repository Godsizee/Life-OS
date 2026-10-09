import type { Erklaerung } from '#lib/core/modul.js';

export interface RingeEingabe {
	wasserZiel: string;
	schlafZielH: number;
	gewichtZiel: string | null;
	gewichtStart: string | null;
}

/** „Wie rechnen die Ringe?“: Ziel und Einheit je Ring. Die Ziele kommen aus den Einstellungen. */
export function ringeErklaerung(e: RingeEingabe): Erklaerung {
	return {
		was: 'Jeder Ring zeigt, wie weit der heutige Wert vom Ziel entfernt ist. Voll heißt: Ziel erreicht.',
		warumJetzt: 'Die Ringe rechnen mit deinen Zielen aus den Einstellungen.',
		daten: [
			`Wasser: Tageswert gegen ${e.wasserZiel}`,
			`Schlaf: Stunden gegen ${e.schlafZielH} h`,
			'Energie: dein Wert von 1 bis 5, voll bei 5',
			e.gewichtZiel
				? `Gewicht: Weg vom ersten Wert${e.gewichtStart ? ` (${e.gewichtStart})` : ''} zum Ziel ${e.gewichtZiel}`
				: 'Gewicht: Ohne Ziel bleibt der Ring leer'
		],
		staerke: 'Ohne Eintrag bleibt ein Ring leer. Das zählt nicht gegen dich.',
		steuerung: [{ label: 'Ziele ändern', href: '/health' }]
	};
}
