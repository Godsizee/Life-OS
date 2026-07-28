/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Offline-Kaltstart.
 *
 * precacheAndRoute() deckt nur die gehashten Build-Assets ab. Navigation
 * INNERHALB der App funktionierte offline (SPA-Router), ein Reload oder
 * App-Start ohne Netz endete aber im Browser-Fehler — bei einer App mit Outbox
 * und Offline-Banner die falsche Erwartung.
 *
 * Bewusst eine eigene Cache-Instanz statt eines Precache-Eintrags: die Seite ist
 * unabhaengig vom Build-Manifest und der Fallback bleibt auch dann intakt, wenn
 * sich die Manifest-Konfiguration aendert.
 */
const OFFLINE_CACHE = 'lifeos-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL)));
});

registerRoute(
	new NavigationRoute(
		async ({ request }) => {
			try {
				return await fetch(request);
			} catch {
				const cache = await caches.open(OFFLINE_CACHE);
				return (await cache.match(OFFLINE_URL)) ?? Response.error();
			}
		},
		// Auth-Callbacks und Edge-Function-Aufrufe muessen ans Netz.
		{ denylist: [/^\/api\//, /^\/auth\//] }
	)
);

self.addEventListener('push', (event: PushEvent) => {
	const data = event.data?.json() ?? {};
	const title = data.title ?? 'Life OS';
	event.waitUntil(
		self.registration.showNotification(title, {
			body: data.body ?? '',
			icon: '/pwa-192x192.png',
			badge: '/pwa-192x192.png',
			data: { url: data.url ?? '/' }
		})
	);
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
	event.notification.close();
	const url = (event.notification.data?.url as string) ?? '/';
	event.waitUntil(
		self.clients.matchAll({ type: 'window' }).then((clientList) => {
			const existing = clientList.find((c) => c.url.endsWith(url));
			if (existing) return existing.focus();
			return self.clients.openWindow(url);
		})
	);
});
