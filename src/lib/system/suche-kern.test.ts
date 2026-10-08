import { describe, expect, it, vi } from 'vitest';
import { befehle, modulEintraege, moduswahl, trefferJeModul } from './suche-kern';

const meta = (id: string, label: string, route: string) =>
	({ id, label, route, kurz: `${label} kurz` }) as never;
const MODULE = [meta('tasks', 'Aufgaben', '/tasks'), meta('focus', 'Fokus', '/focus')];

describe('moduswahl', () => {
	it('erkennt die Präfixe ? und >', () => {
		expect(moduswahl('? zeit')).toEqual({ modus: 'hilfe', anfrage: 'zeit' });
		expect(moduswahl('>fokus')).toEqual({ modus: 'befehle', anfrage: 'fokus' });
		expect(moduswahl(' Milch ')).toEqual({ modus: 'normal', anfrage: 'Milch' });
	});
});

describe('trefferJeModul', () => {
	const suche = (q: string) => [
		{ id: '1', modul: 'tasks' as const, titel: `Steuer ${q}`, href: '/tasks?task=1' }
	];
	it('gruppiert Treffer unter dem Modulnamen und nimmt den Deeplink mit', () => {
		const r = trefferJeModul([{ id: 'tasks', suche }], 'x', () => 'Aufgaben');
		expect(r[0]).toMatchObject({ gruppe: 'Aufgaben', href: '/tasks?task=1', art: 'treffer' });
	});
	it('eine werfende Suche verdeckt die anderen nicht', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const kaputt = {
			id: 'notes' as const,
			suche: () => {
				throw new Error('kaputt');
			}
		};
		const r = trefferJeModul([kaputt, { id: 'tasks', suche }], 'x', () => 'Aufgaben');
		expect(r).toHaveLength(1);
	});
});

describe('modulEintraege / befehle', () => {
	it('filtert Module nach der Anfrage', () => {
		expect(modulEintraege(MODULE, 'auf').map((e) => e.label)).toEqual(['Aufgaben']);
		expect(modulEintraege(MODULE, '')).toHaveLength(2);
	});
	it('Befehle: Modul öffnen, Fokus starten nur bei aktivem Fokus, Einstellungen immer', () => {
		const alle = befehle(MODULE, '').map((b) => b.label);
		expect(alle).toEqual(
			expect.arrayContaining(['Aufgaben öffnen', 'Fokus starten', 'Einstellungen'])
		);
		expect(befehle([MODULE[0]], '').map((b) => b.label)).not.toContain('Fokus starten');
	});
	it('Befehle werden nach der Anfrage gefiltert', () => {
		expect(befehle(MODULE, 'einst').map((b) => b.href)).toEqual(['/settings']);
	});
});
