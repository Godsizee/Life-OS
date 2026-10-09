import type { ModulId } from '#lib/config/modules.js';

/**
 * Welches Modul wem etwas liefert (Quelle der Seite `/hilfe/zusammenspiel`). Steht hier statt in
 * `config/modules.ts`, damit die Texte erst mit der Hilfe laden und nicht im Start-Chunk liegen.
 */
export interface Zusammenspiel {
	mit: ModulId;
	wie: string;
}

export const ZUSAMMENSPIEL: Partial<Record<ModulId, Zusammenspiel[]>> = {
	tasks: [
		{ mit: 'goals', wie: 'Aufgaben können auf ein Ziel einzahlen' },
		{ mit: 'focus', wie: 'Fokusrunden buchen Zeit auf Aufgaben' },
		{ mit: 'calendar', wie: 'Zeitblöcke stehen im Tagesplan neben Terminen' }
	],
	habits: [{ mit: 'goals', wie: 'Routinen können auf ein Ziel einzahlen' }],
	calendar: [{ mit: 'fitness', wie: 'Termine lassen sich mit einem Trainingsplan verknüpfen' }],
	fitness: [{ mit: 'goals', wie: 'Rekorde und Trainingstage bewegen Ziele' }],
	health: [{ mit: 'analytics', wie: 'Schlaf und Energie fließen in Zusammenhänge ein' }],
	mood: [{ mit: 'analytics', wie: 'Stimmung fließt in Zusammenhänge ein' }],
	journal: [{ mit: 'dashboard', wie: 'Der Tageskontext hält die Zahlen des Tages fest' }],
	review: [{ mit: 'tasks', wie: 'Der Wochenrückblick wählt den Wochenfokus' }],
	focus: [{ mit: 'analytics', wie: 'Fokuszeit zählt im Life Score' }],
	notes: [
		{
			mit: 'tasks',
			wie: 'Notizen lassen sich mit allem verknüpfen; Checklisten-Zeilen werden zu Aufgaben'
		}
	],
	shopping: [{ mit: 'dashboard', wie: 'Eine lange Liste erscheint als Hinweis auf Heute' }]
};
