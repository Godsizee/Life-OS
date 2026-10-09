import { describe, expect, it } from 'vitest';
import { modules } from '#lib/config/modules.js';
import { MODULE_MIT_EINSTIEG } from '#lib/system/hilfe-link.js';
import { MODUL_THEMEN } from './module.js';
import { SYSTEM_THEMEN } from './system.js';

const ids = new Set([...SYSTEM_THEMEN, ...MODUL_THEMEN].map((t) => t.id));

describe('Einstiegsthemen der Module', () => {
	it('jedes Modul der Liste hat genau ein Einstiegsthema und umgekehrt', () => {
		const ausThemen = MODUL_THEMEN.map((t) => t.id.replace('.einstieg', '')).sort();
		expect([...MODULE_MIT_EINSTIEG].sort()).toEqual(ausThemen);
		for (const id of MODULE_MIT_EINSTIEG) expect(modules.some((m) => m.id === id)).toBe(true);
	});

	it('hat Titel, kurzen Satz und mindestens einen Abschnitt „So startest du“', () => {
		for (const t of MODUL_THEMEN) {
			expect(t.titel.length).toBeGreaterThan(0);
			expect(t.kurz.length).toBeGreaterThan(10);
			expect(t.abschnitte[0].titel).toBe('So startest du');
			expect(t.abschnitte[0].text.length).toBeGreaterThan(20);
		}
	});

	it('verweist nur auf vorhandene Themen', () => {
		for (const t of MODUL_THEMEN) {
			for (const v of t.verwandt ?? []) expect(ids.has(v), `${t.id} → ${v}`).toBe(true);
		}
	});

	it('klingt sachlich: keine Ausrufezeichen', () => {
		for (const t of MODUL_THEMEN) {
			const text = [t.kurz, ...t.abschnitte.map((a) => a.text)].join(' ');
			expect(text, t.id).not.toMatch(/!/);
		}
	});
});
