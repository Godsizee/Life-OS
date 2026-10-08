import { describe, expect, it } from 'vitest';
import { bodySnippet, passung } from './text';

describe('passung', () => {
	it('rangiert Anfang vor Wortanfang vor Teilstring vor verstreut', () => {
		const a = passung('Steuer machen', 'steu');
		const b = passung('Die Steuer machen', 'steu');
		const c = passung('Umsteuern', 'steu');
		const d = passung('Sehr tolle Eier und Urkunden', 'stu');
		expect(a).toBeGreaterThan(b);
		expect(b).toBeGreaterThan(c);
		expect(c).toBeGreaterThan(d);
		expect(d).toBeGreaterThan(0);
	});
	it('kurze Anfragen suchen nur zusammenhängend', () => {
		expect(passung('Steuer', 'sr')).toBe(0);
		expect(passung('Steuer', 'st')).toBe(1);
	});
	it('leere Anfrage passt neutral, Nichttreffer ist 0', () => {
		expect(passung('Alles', '')).toBe(0.5);
		expect(passung('Alles', 'xyz')).toBe(0);
	});
});

describe('bodySnippet', () => {
	it('liefert Ausschnitt mit Auslassungszeichen', () => {
		expect(bodySnippet('a'.repeat(100) + 'treffer' + 'b'.repeat(100), 'treffer', 5)).toBe(
			'…aaaaatrefferbbbbb…'
		);
		expect(bodySnippet('nichts', 'x')).toBeNull();
	});
});
