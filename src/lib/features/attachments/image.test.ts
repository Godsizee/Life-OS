import { describe, expect, it } from 'vitest';
import {
	buildStoragePath,
	extensionFor,
	fitWithin,
	formatBytes,
	isAcceptedMime,
	MAX_EDGE
} from './image';

describe('fitWithin', () => {
	it('laesst kleine Bilder unveraendert', () => {
		expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
	});

	it('skaliert an der langen Kante (Querformat)', () => {
		expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 });
	});

	it('skaliert an der langen Kante (Hochformat)', () => {
		expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: 1600 });
	});

	it('haelt die Grenze exakt ein', () => {
		expect(fitWithin(MAX_EDGE, MAX_EDGE)).toEqual({ width: MAX_EDGE, height: MAX_EDGE });
	});

	it('erzeugt nie eine Kante von 0', () => {
		expect(fitWithin(10000, 1).height).toBe(1);
	});

	it('gibt bei ungueltigen Massen 0 zurueck', () => {
		expect(fitWithin(0, 0)).toEqual({ width: 0, height: 0 });
	});
});

describe('extensionFor / isAcceptedMime', () => {
	it('kennt die Bildformate', () => {
		expect(extensionFor('image/jpeg')).toBe('jpg');
		expect(extensionFor('image/webp')).toBe('webp');
	});

	it('faellt auf bin zurueck', () => {
		expect(extensionFor('application/zip')).toBe('bin');
	});

	it('akzeptiert nur die Whitelist', () => {
		expect(isAcceptedMime('image/png')).toBe(true);
		expect(isAcceptedMime('application/zip')).toBe(false);
		expect(isAcceptedMime('')).toBe(false);
	});
});

describe('formatBytes', () => {
	it('formatiert die Groessenordnungen', () => {
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(2048)).toBe('2 KB');
		expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
	});

	it('ist gegen Unsinn robust', () => {
		expect(formatBytes(-1)).toBe('0 B');
		expect(formatBytes(Number.NaN)).toBe('0 B');
	});
});

describe('buildStoragePath', () => {
	const ws = '11111111-1111-4111-8111-111111111111';
	const note = '22222222-2222-4222-8222-222222222222';

	it('beginnt mit der Workspace-UUID (Storage-RLS)', () => {
		expect(buildStoragePath(ws, 'note', note, 'image/webp').split('/')[0]).toBe(ws);
	});

	it('folgt der Pfad-Konvention inkl. Endung', () => {
		expect(buildStoragePath(ws, 'note', note, 'image/webp')).toMatch(
			new RegExp(`^${ws}/note/${note}/[0-9a-f-]{36}\\.webp$`)
		);
	});

	it('erzeugt bei jedem Aufruf einen neuen Pfad', () => {
		expect(buildStoragePath(ws, 'note', note, 'image/png')).not.toBe(
			buildStoragePath(ws, 'note', note, 'image/png')
		);
	});
});
