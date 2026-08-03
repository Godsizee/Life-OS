import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toastState } from './toast.svelte';

beforeEach(() => {
	vi.useFakeTimers();
	for (const t of [...toastState.toasts]) toastState.dismiss(t.id);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('Anzeigedauer', () => {
	it('blendet Erfolgsmeldungen nach 3 Sekunden aus', () => {
		toastState.success('gespeichert');
		vi.advanceTimersByTime(2999);
		expect(toastState.toasts).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(toastState.toasts).toHaveLength(0);
	});

	it('laesst Fehler laenger stehen — sie sind oft das einzige Signal', () => {
		toastState.error('Speichern fehlgeschlagen');
		vi.advanceTimersByTime(3000);
		expect(toastState.toasts).toHaveLength(1);
		vi.advanceTimersByTime(5000);
		expect(toastState.toasts).toHaveLength(0);
	});
});

describe('Zusammenfassen', () => {
	it('zaehlt dieselbe Meldung, statt sie zu stapeln', () => {
		toastState.error('Netzwerkfehler');
		toastState.error('Netzwerkfehler');
		toastState.error('Netzwerkfehler');

		expect(toastState.toasts).toHaveLength(1);
		expect(toastState.toasts[0].count).toBe(3);
	});

	it('startet die Anzeigedauer bei jeder Wiederholung neu', () => {
		toastState.error('Netzwerkfehler');
		vi.advanceTimersByTime(7000);
		toastState.error('Netzwerkfehler');
		vi.advanceTimersByTime(7000);

		expect(toastState.toasts).toHaveLength(1);
		vi.advanceTimersByTime(1001);
		expect(toastState.toasts).toHaveLength(0);
	});

	it('haelt unterschiedliche Meldungen auseinander', () => {
		toastState.error('Netzwerkfehler');
		toastState.error('Keine Berechtigung');
		toastState.success('Netzwerkfehler'); // gleicher Text, anderer Typ

		expect(toastState.toasts).toHaveLength(3);
	});
});

describe('Verdraengen', () => {
	it('opfert beim Ueberlauf harmlose Meldungen vor Fehlern', () => {
		toastState.error('wichtig');
		toastState.success('a');
		toastState.info('b');
		toastState.success('c');
		toastState.info('d'); // fuenfte -> eine muss weichen

		expect(toastState.toasts).toHaveLength(4);
		// Vorher fiel per slice(-2) ausgerechnet die aelteste Meldung weg — und
		// das war regelmaessig der Fehler.
		expect(toastState.toasts.some((t) => t.message === 'wichtig')).toBe(true);
		expect(toastState.toasts.some((t) => t.message === 'a')).toBe(false);
	});
});

describe('Aktion', () => {
	it('fasst Meldungen mit Aktion nicht zusammen', () => {
		const run = vi.fn();
		toastState.withAction('info', 'Gelöscht', { label: 'Rückgängig', run });
		toastState.withAction('info', 'Gelöscht', { label: 'Rückgängig', run });

		expect(toastState.toasts).toHaveLength(2);
	});

	it('reicht die Aktion an die Oberflaeche durch', () => {
		const run = vi.fn();
		toastState.withAction('info', 'Gelöscht', { label: 'Rückgängig', run });

		toastState.toasts[0].action?.run();
		expect(run).toHaveBeenCalledOnce();
	});
});
