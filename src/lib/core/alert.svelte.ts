import { haptic } from './haptics';
import { toastState } from './toast.svelte';

/**
 * Aufmerksamkeit erzeugen — mehrstufig, je nachdem was der Browser erlaubt
 * und ob die Seite gerade sichtbar ist.
 *
 * 1. Vibration (funktioniert auch im Hintergrund, sobald die Seite wieder aktiv wird)
 * 2. System-Benachrichtigung über den Service Worker (auch bei geschlossener App)
 * 3. Toast (nur bei sichtbarer Seite)
 * 4. Optionaler Ton (Web Audio, erst nach der ersten Nutzergeste erlaubt)
 */
export interface AlertOptions {
	title: string;
	body?: string;
	/** Deep-Link, den ein Klick auf die Benachrichtigung öffnet. */
	url?: string;
	/** Gleiches Tag ersetzt eine ältere Benachrichtigung, statt zu stapeln. */
	tag?: string;
	vibration?: number | number[];
	sound?: boolean;
}

export async function alarm(opts: AlertOptions): Promise<void> {
	haptic(opts.vibration ?? [200, 100, 200]);

	const sichtbar = typeof document !== 'undefined' && document.visibilityState === 'visible';
	if (sichtbar) toastState.info(opts.body ? `${opts.title} — ${opts.body}` : opts.title);

	if (opts.sound !== false) playChime();

	// Lokale Benachrichtigung über den Service Worker — kein Server, kein VAPID nötig.
	if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
	try {
		const reg = await navigator.serviceWorker.ready;
		await reg.showNotification(opts.title, {
			body: opts.body,
			tag: opts.tag,
			data: { url: opts.url ?? '/' },
			icon: '/pwa-192x192.png',
			badge: '/pwa-192x192.png',
			requireInteraction: false
		});
	} catch {
		// Kein Service Worker (z. B. im Dev-Server ohne PWA) — Toast/Vibration genügen.
	}
}

/** Kurzer Zweiklang über Web Audio. Braucht keine Assetdatei. */
function playChime(): void {
	try {
		const AudioCtx =
			typeof window !== 'undefined'
				? window.AudioContext ||
				  (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
				: null;
		if (!AudioCtx) return;
		const ctx = new AudioCtx();
		const now = ctx.currentTime;

		const osc1 = ctx.createOscillator();
		const gain1 = ctx.createGain();
		osc1.type = 'sine';
		osc1.frequency.setValueAtTime(523.25, now); // C5
		gain1.gain.setValueAtTime(0.15, now);
		gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
		osc1.connect(gain1);
		gain1.connect(ctx.destination);
		osc1.start(now);
		osc1.stop(now + 0.3);

		const osc2 = ctx.createOscillator();
		const gain2 = ctx.createGain();
		osc2.type = 'sine';
		osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
		gain2.gain.setValueAtTime(0.15, now + 0.15);
		gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
		osc2.connect(gain2);
		gain2.connect(ctx.destination);
		osc2.start(now + 0.15);
		osc2.stop(now + 0.45);
	} catch {
		// Web Audio schlägt fehl wenn keine Nutzergeste stattfand
	}
}
