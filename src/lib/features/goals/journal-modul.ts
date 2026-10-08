import { defineModul } from '#lib/core/modul.js';
import { journalAktionen } from './aktionen.js';
import { tagebuchBeitraege } from './beitraege.js';
// Store wird von goalsModul geladen, bis T707 trennt.

export const journalModul = defineModul({
	id: 'journal',
	...tagebuchBeitraege,
	aktionen: journalAktionen
});
