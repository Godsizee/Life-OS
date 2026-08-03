import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toastState } from './toast.svelte';
import { loeschenMitUndo } from './undo';

beforeEach(() => {
	vi.useFakeTimers();
	for (const t of [...toastState.toasts]) toastState.dismiss(t.id);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

function aufbau() {
	return {
		ausblenden: vi.fn(),
		wiederherstellen: vi.fn(),
		festschreiben: vi.fn(async () => {})
	};
}

describe('loeschenMitUndo', () => {
	it('blendet sofort aus, schreibt aber noch nicht', () => {
		const o = aufbau();
		loeschenMitUndo({ text: 'Aufgabe gelöscht', ...o });

		expect(o.ausblenden).toHaveBeenCalledOnce();
		expect(o.festschreiben).not.toHaveBeenCalled();
	});

	it('zeigt eine Meldung mit Rückgängig-Aktion', () => {
		loeschenMitUndo({ text: 'Aufgabe gelöscht', ...aufbau() });

		expect(toastState.toasts).toHaveLength(1);
		expect(toastState.toasts[0].message).toBe('Aufgabe gelöscht');
		expect(toastState.toasts[0].action?.label).toBe('Rückgängig');
	});

	it('schreibt nach Ablauf des Fensters fest', async () => {
		const o = aufbau();
		loeschenMitUndo({ text: 'x', ...o });

		await vi.advanceTimersByTimeAsync(6000);

		expect(o.festschreiben).toHaveBeenCalledOnce();
		expect(o.wiederherstellen).not.toHaveBeenCalled();
	});

	it('holt bei Rücknahme zurück und schreibt nie', async () => {
		const o = aufbau();
		loeschenMitUndo({ text: 'x', ...o });

		toastState.toasts[0].action?.run();
		await vi.advanceTimersByTimeAsync(30_000);

		expect(o.wiederherstellen).toHaveBeenCalledOnce();
		expect(o.festschreiben).not.toHaveBeenCalled();
	});

	it('holt zurück, wenn das Festschreiben scheitert', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const o = aufbau();
		o.festschreiben = vi.fn(async () => {
			throw new Error('offline');
		});
		loeschenMitUndo({ text: 'x', ...o });

		await vi.advanceTimersByTimeAsync(6000);

		// Sonst waere die Zeile aus der Liste verschwunden, obwohl sie noch da ist.
		expect(o.wiederherstellen).toHaveBeenCalledOnce();
		expect(toastState.toasts.some((t) => t.type === 'error')).toBe(true);
	});
});
