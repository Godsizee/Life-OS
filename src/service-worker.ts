/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

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
