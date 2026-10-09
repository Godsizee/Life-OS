import { describe, expect, it } from 'vitest';
import { BEREICHE, nachBereich } from './bereiche';
import { modules } from './modules';

describe('nachBereich', () => {
	it('folgt der Reihenfolge der Bereiche und behält die Reihenfolge der Module darin', () => {
		const gruppen = nachBereich(modules);
		expect(gruppen.map((g) => g.bereich.id)).toEqual(BEREICHE.map((b) => b.id));
		const planen = gruppen.find((g) => g.bereich.id === 'planen')!;
		expect(planen.eintraege.map((m) => m.id)).toEqual(
			modules.filter((m) => m.bereich === 'planen').map((m) => m.id)
		);
	});

	it('lässt Bereiche ohne Module weg', () => {
		const nurTasks = modules.filter((m) => m.id === 'tasks');
		expect(nachBereich(nurTasks).map((g) => g.bereich.id)).toEqual(['planen']);
	});

	it('ordnet jedes Modul genau einem Bereich zu', () => {
		const alle = nachBereich(modules).flatMap((g) => g.eintraege);
		expect(alle).toHaveLength(modules.length);
	});
});
