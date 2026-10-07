/** Katalog aller Domänen-Ereignisse (Zielbild C6). Ein neues Modul trägt hier seine Ereignisse ein. */
export interface LifeEventMap {
	'aufgabe.erstellt': { id: string; titel: string };
	'aufgabe.erledigt': {
		id: string;
		titel: string;
		projektId: string | null;
		zielId: string | null;
	};
	'aufgabe.verworfen': { id: string; titel: string };
	'aufgabe.geloescht': { id: string };
	'aufgabe.fristGeaendert': { id: string; dueAt: string | null };
	'termin.geloescht': { id: string };
	'termin.startGeaendert': { id: string; start: string | null };
	'routine.erledigt': { habitId: string; datum: string; wert: number | null };
	'routine.uebersprungen': { habitId: string; datum: string };
	'routine.geloescht': { habitId: string };
	'training.beendet': {
		logId: string;
		planId: string | null;
		datum: string;
		dauerMin: number | null;
		neueRekorde: { uebung: string; e1rmKg: number }[];
		/** unterschiedliche Trainingstage der laufenden Woche, NACH diesem Training */
		trainingstageDieseWoche: number;
	};
	'stimmung.erfasst': {
		id: string;
		datum: string;
		wert: 1 | 2 | 3 | 4 | 5;
		aktivitaeten: string[];
		tiefeTageInFolge: number;
	};
	'gesundheit.erfasst': {
		datum: string;
		felder: ('weight_kg' | 'sleep_h' | 'water_ml' | 'energy')[];
		wasserMlDelta: number;
	};
	'fokus.beendet': { aufgabeId: string | null; minuten: number };
	'tagebuch.gespeichert': { datum: string; art: 'daily' | 'weekly' };
	'ziel.checkin': { zielId: string; wert: number };
	'einkauf.abgehakt': { id: string; name: string };
	'tag.geplant': { datum: string; geplantMin: number; verfuegbarMin: number };
	/** erledigteAufgaben: Titel der heute erledigten Aufgaben — damit Regeln ohne Store-Zugriff planen können */
	'tag.abgeschlossen': { datum: string; erledigteAufgaben: string[] };
}
export type LifeEventType = keyof LifeEventMap;
