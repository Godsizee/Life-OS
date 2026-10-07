import { defineModul } from '#lib/core/modul.js';
import { journalAktionen } from './aktionen.js';
// Store wird von goalsModul geladen, bis T707 trennt.

export const journalModul = defineModul({
	id: 'journal',
	aktionen: journalAktionen
});
