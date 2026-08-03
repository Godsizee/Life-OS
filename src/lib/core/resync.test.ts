import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abgleichJetzt, fordereAbgleich, setzeAbgleich } from './resync';

describe('resync', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.spyOn(console, 'info').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		setzeAbgleich(null);
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('tut nichts, solange kein Abgleich registriert ist', () => {
		expect(() => fordereAbgleich('test')).not.toThrow();
	});

	it('fuehrt den registrierten Abgleich aus', async () => {
		const fn = vi.fn(async () => {});
		setzeAbgleich(fn);

		fordereAbgleich('test');
		await vi.runAllTimersAsync();

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('verwirft Anforderungen innerhalb der Drosselung', async () => {
		const fn = vi.fn(async () => {});
		setzeAbgleich(fn);

		fordereAbgleich('erster');
		await vi.runAllTimersAsync();
		// Beim Wiederverbinden melden sich alle Kanaele gleichzeitig — daraus darf
		// nicht ein voller Ladevorgang pro Tabelle werden.
		vi.advanceTimersByTime(3000);
		fordereAbgleich('zweiter');
		fordereAbgleich('dritter');
		await vi.runAllTimersAsync();

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('laesst nach Ablauf der Drosselung wieder zu', async () => {
		const fn = vi.fn(async () => {});
		setzeAbgleich(fn);

		fordereAbgleich('erster');
		await vi.runAllTimersAsync();
		vi.advanceTimersByTime(10_001);
		fordereAbgleich('zweiter');
		await vi.runAllTimersAsync();

		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('startet keinen zweiten Durchlauf, waehrend einer laeuft', async () => {
		let aufloesen: (() => void) | null = null;
		const fn = vi.fn(() => new Promise<void>((r) => (aufloesen = r)));
		setzeAbgleich(fn);

		fordereAbgleich('erster');
		vi.advanceTimersByTime(60_000);
		fordereAbgleich('zweiter');
		expect(fn).toHaveBeenCalledTimes(1);

		aufloesen!();
		await vi.runAllTimersAsync();
	});

	it('reisst bei einem Fehler nicht die naechste Anforderung mit', async () => {
		const fn = vi.fn(async () => {
			throw new Error('kaputt');
		});
		setzeAbgleich(fn);

		fordereAbgleich('erster');
		await vi.runAllTimersAsync();
		vi.advanceTimersByTime(10_001);
		fordereAbgleich('zweiter');
		await vi.runAllTimersAsync();

		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('abgleichJetzt ignoriert die Drosselung', async () => {
		const fn = vi.fn(async () => {});
		setzeAbgleich(fn);

		fordereAbgleich('erster');
		await vi.runAllTimersAsync();
		await abgleichJetzt();

		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('setzeAbgleich(null) haelt weitere Anforderungen an', async () => {
		const fn = vi.fn(async () => {});
		setzeAbgleich(fn);
		setzeAbgleich(null);

		fordereAbgleich('test');
		await abgleichJetzt();

		expect(fn).not.toHaveBeenCalled();
	});
});
