import { describe, expect, it } from 'vitest';
import { istAbgeschlossen, istErledigt, istOffen, istVerworfen } from './status';

const s = (status: 'todo' | 'doing' | 'done' | 'dropped') => ({ status });

describe('Aufgaben-Status', () => {
	it('ordnet jeden Status eindeutig ein', () => {
		expect([
			istOffen(s('todo')),
			istOffen(s('doing')),
			istOffen(s('done')),
			istOffen(s('dropped'))
		]).toEqual([true, true, false, false]);
		expect(istErledigt(s('done'))).toBe(true);
		expect(istErledigt(s('dropped'))).toBe(false);
		expect(istVerworfen(s('dropped'))).toBe(true);
		expect(istAbgeschlossen(s('dropped'))).toBe(true);
		expect(istAbgeschlossen(s('doing'))).toBe(false);
	});
});
