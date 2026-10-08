import { toISODate } from '#lib/core/date.js';
import type { Hinweis } from '#lib/core/modul.js';
import { evaluateTrack } from './checkins.js';
import type { Goal, JournalEntry } from './types.js';

const STILLSTAND_TAGE = 14;

/** `goals.ohne-bewegung`: Ein offenes Ziel wurde seit 14 Tagen nicht angefasst (das erste). */
export function ohneBewegung(goals: Goal[], jetzt: Date): Hinweis[] {
	const grenze = new Date(jetzt);
	grenze.setDate(grenze.getDate() - STILLSTAND_TAGE);
	const ruht = goals.find(
		(g) => g.status === 'open' && !g.archived && new Date(g.updated_at) < grenze
	);
	if (!ruht) return [];
	return [
		{
			id: `goals.ohne-bewegung:${ruht.id}`,
			art: 'goals.ohne-bewegung',
			titel: `„${ruht.title}“ ruht seit zwei Wochen`,
			text: 'Anpassen, pausieren oder weitermachen: Du entscheidest.',
			warum: {
				was: `Das Ziel „${ruht.title}“ hat seit ${STILLSTAND_TAGE} Tagen kein Update.`,
				warumJetzt: 'Nach zwei Wochen ohne Änderung lohnt eine Entscheidung.',
				daten: [`Zuletzt geändert: ${toISODate(new Date(ruht.updated_at))}`],
				steuerung: [{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' }]
			},
			aktion: { label: 'Ziel öffnen', href: `/goals/${ruht.id}` },
			prioritaet: 30
		}
	];
}

/** `goals.hinterher`: Ein Ziel liegt hinter dem Plan oder ist über dem Termin (das erste). */
export function hinterher(goals: Goal[], fortschritt: (g: Goal) => number, jetzt: Date): Hinweis[] {
	for (const g of goals) {
		if (g.status === 'done' || g.archived) continue;
		const track = evaluateTrack(g, fortschritt(g), jetzt);
		if (track.state !== 'overdue' && track.state !== 'behind') continue;
		const ueber = track.state === 'overdue';
		return [
			{
				id: `goals.hinterher:${g.id}`,
				art: 'goals.hinterher',
				titel: ueber ? `„${g.title}“ ist über dem Termin` : `„${g.title}“ liegt hinter dem Plan`,
				text: track.label,
				warum: {
					was: `Das Ziel „${g.title}“ ${ueber ? 'ist über dem Termin' : 'liegt hinter dem Plan'}.`,
					warumJetzt: 'Der Fortschritt passt nicht zum Zeitraum, den das Ziel vorgibt.',
					daten: [track.label],
					steuerung: [{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' }]
				},
				aktion: { label: 'Ziel öffnen', href: `/goals/${g.id}` },
				prioritaet: ueber ? 60 : 50
			}
		];
	}
	return [];
}

/** `journal.pause`: Seit drei Tagen kein Tageseintrag (Wochenrückblicke zählen nicht). Standardmäßig aus. */
export function tagebuchPause(eintraege: JournalEntry[], jetzt: Date): Hinweis[] {
	const tage = new Set(eintraege.filter((j) => j.kind !== 'weekly').map((j) => j.date));
	for (let i = 1; i <= 3; i++) {
		const d = new Date(jetzt);
		d.setDate(d.getDate() - i);
		if (tage.has(toISODate(d))) return [];
	}
	return [
		{
			id: 'journal.pause:sammel',
			art: 'journal.pause',
			titel: 'Drei Tage ohne Tagebucheintrag',
			text: 'Wenn du magst: ein paar Zeilen zu den letzten Tagen.',
			warum: {
				was: 'In den letzten drei Tagen gibt es keinen Tagebucheintrag.',
				warumJetzt: 'Dieser Hinweis ist standardmäßig aus und wurde von dir eingeschaltet.',
				daten: [],
				steuerung: [{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' }]
			},
			aktion: { label: 'Tagebuch öffnen', href: '/journal' },
			prioritaet: 10
		}
	];
}

/** `journal.heute`: Heute steht noch nichts im Tagebuch. Standardmäßig aus (der Tagesabschluss übernimmt). */
export function tagebuchHeute(heute: JournalEntry | undefined, jetzt: Date): Hinweis[] {
	if (heute) return [];
	return [
		{
			id: `journal.heute:${toISODate(jetzt)}`,
			art: 'journal.heute',
			titel: 'Wie war dein Tag?',
			text: 'Für heute steht noch kein Tagebucheintrag.',
			warum: {
				was: 'Für heute gibt es keinen Tagebucheintrag.',
				warumJetzt: 'Dieser Hinweis ist standardmäßig aus und wurde von dir eingeschaltet.',
				daten: [],
				steuerung: [{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' }]
			},
			aktion: { label: 'Schreiben', href: '/journal' },
			prioritaet: 10
		}
	];
}
