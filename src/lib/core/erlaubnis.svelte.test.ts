import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { braucheInstallation, erlaubnis } from './erlaubnis.svelte';

function stubNotification(permission: NotificationPermission, antwort: NotificationPermission) {
	const requestPermission = vi.fn(async () => antwort);
	const N = { permission, requestPermission };
	vi.stubGlobal('Notification', N);
	vi.stubGlobal('window', { Notification: N });
	return requestPermission;
}

describe('Erlaubnis-Erklärung', () => {
	beforeEach(() => erlaubnis.lehneAb());
	afterEach(() => vi.unstubAllGlobals());

	it('fragt den Browser erst nach „Erlauben“', async () => {
		const request = stubNotification('default', 'granted');
		const antwort = erlaubnis.frageNach('push');
		expect(erlaubnis.art).toBe('push');
		expect(request).not.toHaveBeenCalled();
		await erlaubnis.bestaetige();
		expect(request).toHaveBeenCalledOnce();
		await expect(antwort).resolves.toBe('granted');
		expect(erlaubnis.art).toBeNull();
	});

	it('„Nicht jetzt“ fragt den Browser nie', async () => {
		const request = stubNotification('default', 'granted');
		const antwort = erlaubnis.frageNach('timer');
		erlaubnis.lehneAb();
		await expect(antwort).resolves.toBe('default');
		expect(request).not.toHaveBeenCalled();
	});

	it('zeigt nichts, wenn schon entschieden ist', async () => {
		const request = stubNotification('granted', 'granted');
		await expect(erlaubnis.frageNach('push')).resolves.toBe('granted');
		expect(erlaubnis.art).toBeNull();
		expect(request).not.toHaveBeenCalled();
		stubNotification('denied', 'granted');
		await expect(erlaubnis.frageNach('push')).resolves.toBe('denied');
	});

	it('meldet fehlende Unterstützung', async () => {
		vi.stubGlobal('window', {});
		await expect(erlaubnis.frageNach('push')).resolves.toBe('nicht-unterstuetzt');
	});

	it('iPhone ohne Installation braucht zuerst die installierte App', () => {
		const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
		expect(braucheInstallation(iphone, false)).toBe(true);
		expect(braucheInstallation(iphone, true)).toBe(false);
		expect(braucheInstallation('Mozilla/5.0 (Windows NT 10.0)', false)).toBe(false);
	});
});
