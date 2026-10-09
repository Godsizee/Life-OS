import { describe, expect, it } from 'vitest';
import { waehleBand, type BandEingabe } from './baender-kern';

const RUHIG: BandEingabe = {
	updateVerfuegbar: false,
	online: true,
	syncStatus: 'idle',
	wartend: 0,
	unzustellbar: 0
};

describe('waehleBand', () => {
	it('zeigt nichts, wenn alles ruhig ist', () => {
		expect(waehleBand(RUHIG)).toBeNull();
	});

	it('Offline nennt die Zahl der gesammelten Änderungen', () => {
		const b = waehleBand({ ...RUHIG, online: false, wartend: 3 });
		expect(b?.art).toBe('offline');
		expect(b?.text).toBe(
			'OFFLINE — Änderungen werden auf diesem Gerät gesammelt (3) und später übertragen.'
		);
	});

	it('Offline ohne wartende Änderungen lässt die Klammer weg', () => {
		expect(waehleBand({ ...RUHIG, online: false })?.text).not.toContain('(');
	});

	it('Unzustellbares: Einzahl und Mehrzahl, mit Aktion „Ansehen“', () => {
		expect(waehleBand({ ...RUHIG, unzustellbar: 1 })?.text).toBe(
			'1 Änderung konnte nicht gespeichert werden.'
		);
		const b = waehleBand({ ...RUHIG, unzustellbar: 3 });
		expect(b?.text).toBe('3 Änderungen konnten nicht gespeichert werden.');
		expect(b?.aktion?.art).toBe('ansehen');
	});

	it('Sync-Fehler bietet „Erneut versuchen“', () => {
		const b = waehleBand({ ...RUHIG, syncStatus: 'error', wartend: 2 });
		expect(b?.art).toBe('sync-fehler');
		expect(b?.variante).toBe('fehler');
		expect(b?.aktion?.art).toBe('erneut');
	});

	it('Rangfolge: Update > Offline > Sync-Fehler > Unzustellbares > Synchronisieren > Modus', () => {
		const alles: BandEingabe = {
			updateVerfuegbar: true,
			online: false,
			syncStatus: 'error',
			wartend: 1,
			unzustellbar: 2,
			modus: 'MODUS: LEISER TAG'
		};
		expect(waehleBand(alles)?.art).toBe('update');
		expect(waehleBand({ ...alles, updateVerfuegbar: false })?.art).toBe('offline');
		expect(waehleBand({ ...alles, updateVerfuegbar: false, online: true })?.art).toBe(
			'sync-fehler'
		);
		expect(
			waehleBand({ ...alles, updateVerfuegbar: false, online: true, syncStatus: 'syncing' })?.art
		).toBe('unzustellbar');
		expect(
			waehleBand({
				...alles,
				updateVerfuegbar: false,
				online: true,
				syncStatus: 'syncing',
				unzustellbar: 0
			})?.art
		).toBe('sync');
		expect(
			waehleBand({
				...alles,
				updateVerfuegbar: false,
				online: true,
				syncStatus: 'idle',
				unzustellbar: 0
			})?.art
		).toBe('modus');
	});
});
