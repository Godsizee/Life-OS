import { afterEach, describe, expect, it, vi } from 'vitest';
import { _alleHandlerEntfernen, emit, MAX_TIEFE, on } from './ereignisse';

const warte = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => _alleHandlerEntfernen());

describe('Ereignis-Bus', () => {
	it('stellt asynchron zu, mit Ursache Nutzer als Standard', async () => {
		const fn = vi.fn();
		on('aufgabe.erstellt', fn);
		emit('aufgabe.erstellt', { id: 'a1', titel: 'Steuer' });
		expect(fn).not.toHaveBeenCalled();
		await warte();
		expect(fn).toHaveBeenCalledOnce();
		expect(fn.mock.calls[0][0]).toMatchObject({
			typ: 'aufgabe.erstellt',
			daten: { id: 'a1', titel: 'Steuer' },
			ursache: { art: 'nutzer', tiefe: 0 }
		});
	});

	it('ein fehlschlagender Handler stoppt die anderen nicht', async () => {
		const fehler = vi.spyOn(console, 'error').mockImplementation(() => {});
		const zweiter = vi.fn();
		on('aufgabe.geloescht', () => {
			throw new Error('kaputt');
		});
		on('aufgabe.geloescht', zweiter);
		emit('aufgabe.geloescht', { id: 'a1' });
		await warte();
		expect(zweiter).toHaveBeenCalledOnce();
		expect(fehler).toHaveBeenCalled();
		fehler.mockRestore();
	});

	it('bricht Ketten ab MAX_TIEFE ab', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const fn = vi.fn();
		on('routine.erledigt', fn);
		emit(
			'routine.erledigt',
			{ habitId: 'h1', datum: '2026-10-07', wert: null },
			{ art: 'automation', regelId: 'sys:x', tiefe: MAX_TIEFE }
		);
		await warte();
		expect(fn).not.toHaveBeenCalled();
		warn.mockRestore();
	});

	it('on() liefert eine Abmeldung', async () => {
		const fn = vi.fn();
		const ab = on('einkauf.abgehakt', fn);
		ab();
		emit('einkauf.abgehakt', { id: 's1', name: 'Milch' });
		await warte();
		expect(fn).not.toHaveBeenCalled();
	});
});
