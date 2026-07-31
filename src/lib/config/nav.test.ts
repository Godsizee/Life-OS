import { describe, expect, it } from 'vitest';
import { resolveNavModules } from './nav';
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
});
