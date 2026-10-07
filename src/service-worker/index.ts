/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `lifeos-${version}`;
/** ssr = false: Jede Route liefert dieselbe Hülle — eine gecachte reicht für alle. */
const HUELLE = '/';
const OFFLINE = '/offline.html';
/** Groß und zur Laufzeit unnötig — NICHT vorab laden (Falle F21). */
const AUSGESCHLOSSEN = [/\/logo\.png$/, /\/robots\.txt$/];

// $app/manifest liefert { path }-Objekte relativ zum Basispfad (ohne führenden Slash).
const absolut = (p: string) => (p.startsWith('/') ? p : `/${p}`);

// Set statt Array: offline.html steckt auch in `assets`, und cache.addAll() bricht
// bei doppelten Einträgen die ganze Installation ab (InvalidStateError).
const VORAB_SET = new Set([
	...immutable.map((e) => absolut(e.path)),
	...assets.map((e) => absolut(e.path)).filter((a) => !AUSGESCHLOSSEN.some((re) => re.test(a))),
	HUELLE,
	OFFLINE
]);
const VORAB = [...VORAB_SET];

sw.addEventListener('install', (event) => {
	// KEIN skipWaiting(): Ein laufender Tab lädt Chunks seiner Version nach. Würden
	// die alten Caches sofort gelöscht, bräche jede spätere Navigation. Aktiviert
	// wird erst nach Bestätigung (Nachricht SKIP_WAITING, siehe T103).
	event.waitUntil(caches.open(CACHE).then((c) => c.addAll(VORAB)));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				// Auch die Caches des alten Workbox-SW (workbox-precache-*, lifeos-offline-v1) räumen.
				if (key !== CACHE && (key.startsWith('lifeos-') || key.startsWith('workbox-'))) {
					await caches.delete(key);
				}
			}
			await sw.clients.claim();
		})()
	);
});

sw.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') void sw.skipWaiting();
});

sw.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	// Fremde Hosts (Supabase, Push-Dienste) nie anfassen.
	if (url.origin !== sw.location.origin) return;

	if (req.mode === 'navigate') {
		event.respondWith(
			(async () => {
				const cache = await caches.open(CACHE);
				try {
					const res = await fetch(req);
					if (res.ok) await cache.put(HUELLE, res.clone());
					return res;
				} catch {
					return (
						(await cache.match(HUELLE, { ignoreVary: true })) ??
						(await cache.match(OFFLINE, { ignoreVary: true })) ??
						Response.error()
					);
				}
			})()
		);
		return;
	}

	if (VORAB_SET.has(url.pathname)) {
		// ignoreVary: Der Server antwortet mit `Vary: Origin`, Modul-Skripte senden einen
		// Origin-Header, addAll() nicht — ohne die Option gäbe es offline nie einen Treffer.
		event.respondWith(
			caches
				.match(url.pathname, { cacheName: CACHE, ignoreVary: true })
				.then((treffer) => treffer ?? fetch(req))
		);
	}
});

/** Altes Format {title, body, url} UND deklaratives Format {web_push, notification} (Safari 18.4+). */
interface PushNutzlast {
	title?: string;
	body?: string;
	url?: string;
	web_push?: number;
	notification?: {
		title?: string;
		body?: string;
		navigate?: string;
		tag?: string;
		app_badge?: string;
	};
}

sw.addEventListener('push', (event) => {
	let d: PushNutzlast = {};
	try {
		d = (event.data?.json() as PushNutzlast) ?? {};
	} catch {
		d = { body: event.data?.text() ?? '' };
	}
	const n = d.notification ?? {};
	const titel = n.title ?? d.title ?? 'Life OS';
	const ziel = n.navigate ?? d.url ?? '/';
	event.waitUntil(
		(async () => {
			await sw.registration.showNotification(titel, {
				body: n.body ?? d.body ?? '',
				icon: '/pwa-192x192.png',
				badge: '/pwa-192x192.png',
				tag: n.tag,
				data: { url: ziel }
			});
			const badge = n.app_badge !== undefined ? Number(n.app_badge) : null;
			const nav = sw.navigator as WorkerNavigator & {
				setAppBadge?: (n: number) => Promise<void>;
			};
			if (badge !== null && Number.isFinite(badge) && nav.setAppBadge) await nav.setAppBadge(badge);
		})()
	);
});

sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const ziel = new URL((event.notification.data?.url as string) ?? '/', sw.location.origin).href;
	event.waitUntil(
		(async () => {
			const fenster = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
			const offen = fenster[0] as WindowClient | undefined;
			if (offen) {
				await offen.focus();
				await offen.navigate(ziel);
				return;
			}
			await sw.clients.openWindow(ziel);
		})()
	);
});
