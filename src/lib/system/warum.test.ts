import { describe, expect, it } from 'vitest';
import type { AgendaEintrag } from '#lib/core/modul.js';
import { verrechne } from '#lib/core/score.js';
import { baueTagesplan } from './agenda.js';
import { kapazitaetErklaerung, scoreErklaerung } from './warum.js';

describe('Warum: Life Score', () => {
	it('zeigt je Bereich Wert × Anteil = Beitrag und nennt Bereiche, die nicht zählen', () => {
		const e = verrechne(
			[
				{ modul: 'tasks', label: 'Aufgaben', wert: 80, gewicht: 4, erklaerung: '' },
				{ modul: 'habits', label: 'Routinen', wert: 50, gewicht: 4, erklaerung: '' },
				{ modul: 'mood', label: 'Stimmung', wert: null, gewicht: 2, erklaerung: '' },
				{ modul: 'focus', label: 'Fokus', wert: 70, gewicht: 0, erklaerung: '' }
			],
			false
		);
		const w = scoreErklaerung(e);
		expect(w.warumJetzt).toBe('Die Beiträge ergeben zusammen 65 von 100.');
		expect(w.daten).toContain('Aufgaben: 80 × 50 % = 40 Punkte');
		expect(w.daten).toContain('Routinen: 50 × 50 % = 25 Punkte');
		expect(w.daten).toContain('Stimmung: zählt heute nicht (kein Eintrag)');
		expect(w.daten).toContain('Fokus: zählt heute nicht (Gewicht 0)');
		expect(w.steuerung.map((s) => s.href)).toContain('/settings#score');
	});

	it('bleibt ohne Daten ehrlich leer', () => {
		for (const e of [null, verrechne([], false)]) {
			const w = scoreErklaerung(e);
			expect(w.daten).toEqual([]);
			expect(w.warumJetzt).toMatch(/noch nichts/);
		}
	});
});

describe('Warum: Kapazität', () => {
	const tag = new Date(2026, 9, 9);
	const um = (h: number, m = 0) => new Date(2026, 9, 9, h, m);
	const eintrag = (teil: Partial<AgendaEintrag>): AgendaEintrag => ({
		key: Math.random().toString(),
		modul: 'tasks',
		art: 'aufgabe',
		titel: 't',
		start: null,
		ende: null,
		dauerMin: null,
		erledigt: false,
		href: '/',
		warum: '',
		...teil
	});

	it('nennt Fenster, Termine, Schätzungen und Aufgaben mit Standarddauer', () => {
		const plan = baueTagesplan(
			[
				eintrag({ dauerMin: 90 }),
				eintrag({ dauerMin: 30 }),
				eintrag({}),
				eintrag({ erledigt: true, dauerMin: 45 }),
				eintrag({ art: 'termin', modul: 'calendar', start: um(10), ende: um(11), dauerMin: 60 })
			],
			{ beginn: um(8), ende: um(20) },
			30
		);
		expect(tag.getDate()).toBe(9);
		const w = kapazitaetErklaerung(plan, { beginn: '08:00', ende: '20:00' }, 30);
		expect(w.warumJetzt).toBe('Geplant 2 h 30 min, frei 11 h.');
		expect(w.daten).toEqual([
			'Tagesfenster: 08:00 bis 20:00',
			'Termine: 1 h (überlappende zählen einmal, ganztägige gar nicht)',
			'Schätzungen: 2 h aus 2 Aufgaben',
			'Ohne Schätzung: 1 Aufgabe mit je 30 min Standarddauer'
		]);
		expect(w.staerke).toBeUndefined();
	});

	it('weist bei Überbuchung darauf hin, ohne zu werten', () => {
		const plan = baueTagesplan([eintrag({ dauerMin: 900 })], { beginn: um(8), ende: um(20) }, 30);
		expect(kapazitaetErklaerung(plan, { beginn: '08:00', ende: '20:00' }, 30).staerke).toMatch(
			/kein Fehler/
		);
	});
});
