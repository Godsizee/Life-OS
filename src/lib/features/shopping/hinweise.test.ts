import { describe, expect, it } from 'vitest';
import { listeVoll } from './hinweise';

const items = (n: number, checked = false) => Array.from({ length: n }, () => ({ checked }));

describe('shopping.liste-voll', () => {
	it('meldet erst über zwölf offenen Posten', () => {
		const r = listeVoll(items(13));
		expect(r).toHaveLength(1);
		expect(r[0].titel).toContain('13');
	});
	it('schweigt bei genau zwölf', () => {
		expect(listeVoll(items(12))).toEqual([]);
	});
	it('zählt abgehakte Posten nicht mit', () => {
		expect(listeVoll(items(20, true))).toEqual([]);
	});
});
