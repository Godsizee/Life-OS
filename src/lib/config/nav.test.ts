import { describe, expect, it } from 'vitest';
import { modulFuerPfad, resolveNavModules } from './nav';
import { bottomNavModuleIds } from './modules';

describe('resolveNavModules', () => {
	it('füllt auf 4 auf, wenn zu wenige gewählt sind', () => {
		expect(resolveNavModules(['fitness'])).toHaveLength(4);
	});
	it('ignoriert unbekannte IDs', () => {
		expect(resolveNavModules(['gibtsnicht', 'tasks']).map((m) => m.id)).toContain('tasks');
	});
	it('liefert die Standardliste ohne Einstellung', () => {
		expect(resolveNavModules(undefined).map((m) => m.id)).toEqual([...bottomNavModuleIds]);
	});
	it('überspringt abgeschaltete Module und füllt mit aktiven auf', () => {
		const ids = resolveNavModules(['fitness', 'notes'], (id) => id !== 'notes').map((m) => m.id);
		expect(ids).toHaveLength(4);
		expect(ids).not.toContain('notes');
		expect(ids[0]).toBe('fitness');
	});
});

describe('modulFuerPfad', () => {
	it('findet das Modul per Präfix', () => {
		expect(modulFuerPfad('/fitness')?.id).toBe('fitness');
		expect(modulFuerPfad('/fitness/exercise/abc')?.id).toBe('fitness');
	});
	it('verwechselt keine Namenspräfixe und kennt weder / noch Einstellungen', () => {
		expect(modulFuerPfad('/tasksfoo')).toBeUndefined();
		expect(modulFuerPfad('/')).toBeUndefined();
		expect(modulFuerPfad('/settings')).toBeUndefined();
	});
});
