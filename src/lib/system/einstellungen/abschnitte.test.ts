import { describe, expect, it } from 'vitest';
import { abschnitte, nachStufe, trifft } from './abschnitte.js';

describe('Einstellungs-Abschnitte', () => {
	const alle = abschnitte();
	const defs = alle.flatMap((a) => a.defs);

	it('liefert die Anker, auf die Links in der App zeigen', () => {
		const ids = alle.map((a) => a.id);
		for (const anker of ['darstellung', 'module', 'heute', 'hinweise', 'score', 'hilfe']) {
			expect(ids).toContain(anker);
		}
	});

	it('jede erzeugte Einstellung hat Label, Hinweis und eine Oberfläche außer „eigen“', () => {
		for (const d of defs) {
			expect(d.label.length, d.schluessel).toBeGreaterThan(0);
			expect(d.hinweis?.length ?? 0, d.schluessel).toBeGreaterThan(0);
			expect(d.ui.art, d.schluessel).not.toBe('eigen');
		}
	});

	it('Schlüssel sind flach und eindeutig', () => {
		const keys = defs.map((d) => d.schluessel);
		expect(new Set(keys).size).toBe(keys.length);
		for (const k of keys) expect(k).toMatch(/^[a-z]+\.[A-Za-z0-9.-]+$/);
	});

	it('die Suche „dicht“ findet „Dichte“, ohne Suche passt alles', () => {
		const dichte = defs.find((d) => d.schluessel === 'darstellung.dichte');
		expect(dichte).toBeDefined();
		expect(trifft(dichte!, 'dicht')).toBe(true);
		expect(trifft(dichte!, 'zzz')).toBe(false);
		expect(trifft(dichte!, '  ')).toBe(true);
	});

	it('ordnet erst schnelle, dann Modul-, zuletzt erweiterte Einstellungen', () => {
		const stufen = nachStufe(alle.find((a) => a.id === 'darstellung')!.defs).map((d) => d.stufe);
		expect(stufen).toEqual(
			[...stufen].sort(
				(a, b) =>
					['schnell', 'modul', 'erweitert'].indexOf(a) -
					['schnell', 'modul', 'erweitert'].indexOf(b)
			)
		);
	});
});
