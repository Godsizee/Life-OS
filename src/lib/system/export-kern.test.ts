import { describe, expect, it, vi } from 'vitest';
import { baueExport } from './export-kern';

const quellen = (module: Parameters<typeof baueExport>[0]['module']) => ({
	profil: { display_name: 'Ada', settings: { a: 1 } },
	dienste: { links: [1] },
	module,
	jetzt: new Date('2026-10-08T10:00:00Z')
});

describe('baueExport', () => {
	it('führt die Beiträge aller Module zusammen und nennt Version und Module', () => {
		const r = baueExport(
			quellen([
				{ id: 'tasks', export: () => ({ tasks: [1], projects: [] }) },
				{ id: 'notes', export: () => ({ notes: [2] }) },
				{ id: 'timeline' }
			])
		);
		expect(r).toMatchObject({
			version: 2,
			export_date: '2026-10-08T10:00:00.000Z',
			module: ['tasks', 'notes', 'timeline'],
			profile: { display_name: 'Ada' },
			workspace: { tasks: [1], projects: [], notes: [2], links: [1] }
		});
	});

	it('ein werfender Beitrag verdirbt den Export der übrigen nicht', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const r = baueExport(
			quellen([
				{
					id: 'tasks',
					export: () => {
						throw new Error('kaputt');
					}
				},
				{ id: 'notes', export: () => ({ notes: [2] }) }
			])
		) as { workspace: Record<string, unknown> };
		expect(r.workspace.notes).toEqual([2]);
		expect(r.workspace.tasks).toBeUndefined();
	});
});
