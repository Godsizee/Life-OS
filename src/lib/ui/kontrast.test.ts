import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { kontrast } from './kontrast.js';

const css = readFileSync('src/app.css', 'utf8');
type Token = Record<string, string>;

/** Liest die 6-stelligen Hex-Werte aus dem ersten Block mit diesem Selektor. */
const block = (selektor: string): Token => {
	const start = css.indexOf(selektor + ' {');
	if (start < 0) throw new Error('Block fehlt: ' + selektor);
	const teil = css.slice(start, css.indexOf('}', start));
	return Object.fromEntries(
		[...teil.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)].map((m) => [m[1], m[2]])
	);
};

const hell = block(':root');
const dunkel: Token = { ...hell, ...block('html.dark') };
const gedaempft: Token = { ...hell, ...block("html[data-farben='gedaempft']") };
const MODULE = [
	'dashboard',
	'tasks',
	'notes',
	'habits',
	'calendar',
	'shopping',
	'goals',
	'journal',
	'focus',
	'review',
	'mood',
	'health',
	'fitness',
	'analytics',
	'timeline'
];
const SIGNALE = ['limette', 'orange', 'pink', 'blau'];

describe('Kontrast WCAG 2.x AA', () => {
	for (const [name, t] of [
		['hell', hell],
		['dunkel', dunkel]
	] as const) {
		it(`${name}: Text auf Seite/Fläche ≥ 4,5`, () => {
			for (const text of ['tinte', 'text-2', 'text-3'])
				for (const grund of ['seite', 'flaeche', 'flaeche-2'])
					expect(kontrast(t[text], t[grund]), `${text} auf ${grund}`).toBeGreaterThanOrEqual(4.5);
		});
	}

	for (const [name, t] of [
		['kräftig', hell],
		['gedämpft', gedaempft]
	] as const) {
		it(`${name}: Text auf jeder Modulfarbe ≥ 4,5`, () => {
			for (const m of MODULE)
				expect(kontrast(t['auf-farbe'], t['mod-' + m]), m).toBeGreaterThanOrEqual(4.5);
		});
	}

	it('dunkel: Text auf Modulfarben bleibt schwarz auf Farbe ≥ 4,5', () => {
		for (const m of MODULE)
			expect(kontrast(dunkel['auf-farbe'], dunkel['mod-' + m]), m).toBeGreaterThanOrEqual(4.5);
	});

	it('Signal und Semantik ≥ 4,5', () => {
		expect(kontrast(hell['auf-farbe'], hell['signal'])).toBeGreaterThanOrEqual(4.5);
		expect(kontrast(hell['auf-gefahr'], hell['gefahr'])).toBeGreaterThanOrEqual(4.5);
		expect(kontrast(hell['auf-erfolg'], hell['erfolg'])).toBeGreaterThanOrEqual(4.5);
		expect(kontrast(hell['auf-info'], hell['info'])).toBeGreaterThanOrEqual(4.5);
		for (const s of SIGNALE)
			expect(
				kontrast(hell['auf-farbe'], block(`html[data-signal='${s}']`)['signal']),
				s
			).toBeGreaterThanOrEqual(4.5);
	});

	it('alle Modulfarben sind im Stylesheet definiert (kräftig und gedämpft)', () => {
		for (const m of MODULE) {
			expect(hell['mod-' + m], `kräftig ${m}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
			expect(gedaempft['mod-' + m], `gedämpft ${m}`).not.toBe(hell['mod-' + m]);
		}
	});
});
