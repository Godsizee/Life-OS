import { toISODate } from '#lib/core/date.js';
import type { Hinweis } from '#lib/core/modul.js';
import { waterMl } from './stats.js';
import type { HealthEntry } from './types.js';

const KURZE_NACHT_H = 6;
const WASSER_AB = '12:00';

/**
 * `health.schlaf-knapp`: In drei der letzten fünf Einträge stehen weniger als sechs Stunden Schlaf.
 * Reine Beobachtung, keine gesundheitliche Aussage.
 */
export function schlafKnapp(eintraege: HealthEntry[]): Hinweis[] {
	const letzte = eintraege.slice(0, 5);
	const kurz = letzte.filter((e) => e.sleep_h !== null && e.sleep_h < KURZE_NACHT_H);
	if (kurz.length < 3) return [];
	return [
		{
			id: 'health.schlaf-knapp:sammel',
			art: 'health.schlaf-knapp',
			titel: 'Mehrere kurze Nächte',
			text: `In ${kurz.length} der letzten ${letzte.length} Einträge stehen unter ${KURZE_NACHT_H} Stunden Schlaf.`,
			warum: {
				was: `${kurz.length} von ${letzte.length} Einträgen haben weniger als ${KURZE_NACHT_H} Stunden Schlaf.`,
				warumJetzt: 'Ab drei kurzen Nächten unter den letzten fünf Einträgen fällt es auf.',
				daten: kurz.map((e) => `${e.date}: ${e.sleep_h} h`),
				staerke: `Beobachtung über die letzten ${letzte.length} Einträge`,
				steuerung: [{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' }]
			},
			aktion: { label: 'Gesundheit öffnen', href: '/health' },
			prioritaet: 40
		}
	];
}

/** `health.wasser-heute`: Ab 12:00 und noch kein Wasser eingetragen. */
export function wasserHeute(heute: HealthEntry | null | undefined, jetzt: Date): Hinweis[] {
	if (jetzt.getHours() < Number(WASSER_AB.slice(0, 2))) return [];
	const ml = heute ? waterMl(heute) : null;
	if (ml !== null && ml > 0) return [];
	return [
		{
			id: `health.wasser-heute:${toISODate(jetzt)}`,
			art: 'health.wasser-heute',
			titel: 'Noch kein Wasser eingetragen',
			text: 'Für heute steht noch nichts. Ein Glas eintragen?',
			warum: {
				was: 'Für heute ist kein Wasser eingetragen.',
				warumJetzt: `Es ist nach ${WASSER_AB} und der Tag ist ohne Eintrag.`,
				daten: ['Wasser heute: 0 ml'],
				steuerung: [{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' }]
			},
			aktion: { label: '+1 Glas', href: '/health' },
			prioritaet: 30
		}
	];
}
