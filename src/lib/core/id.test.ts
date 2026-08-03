import { afterEach, describe, expect, it, vi } from 'vitest';
import { neueId } from './id';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('neueId', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('liefert eine gueltige UUID v4', () => {
		expect(neueId()).toMatch(UUID_V4);
	});

	it('liefert bei wiederholtem Aufruf unterschiedliche IDs', () => {
		const ids = new Set(Array.from({ length: 500 }, () => neueId()));
		expect(ids.size).toBe(500);
	});

	it('nutzt crypto.randomUUID, wenn vorhanden', () => {
		const spy = vi.spyOn(crypto, 'randomUUID');
		neueId();
		expect(spy).toHaveBeenCalled();
	});

	// Der Fall im unsicheren Kontext (http auf LAN-IP): randomUUID fehlt komplett.
	describe('ohne crypto.randomUUID', () => {
		// Die echte Implementierung vorher festhalten — sonst zeigt der Stub auf
		// sich selbst und ruft sich endlos auf.
		const echtesGetRandomValues = crypto.getRandomValues.bind(crypto);

		function ohneRandomUUID() {
			vi.stubGlobal('crypto', { getRandomValues: echtesGetRandomValues });
		}

		it('faellt auf getRandomValues zurueck und liefert eine gueltige v4', () => {
			ohneRandomUUID();
			expect(neueId()).toMatch(UUID_V4);
		});

		it('liefert auch im Fallback eindeutige IDs', () => {
			ohneRandomUUID();
			const ids = new Set(Array.from({ length: 500 }, () => neueId()));
			expect(ids.size).toBe(500);
		});

		it('setzt Versions- und Variantenbits korrekt', () => {
			ohneRandomUUID();
			for (let i = 0; i < 50; i++) {
				const id = neueId();
				expect(id[14]).toBe('4');
				expect('89ab').toContain(id[19]);
			}
		});
	});
});
