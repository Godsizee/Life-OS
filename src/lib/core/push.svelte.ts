import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64: string): Uint8Array {
	const padding = '='.repeat((4 - (base64.length % 4)) % 4);
	const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(normalized);
	return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

class PushState {
	supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
	permission = $state<NotificationPermission>(this.supported ? Notification.permission : 'denied');
	subscribed = $state(false);
	loading = $state(false);

	async init() {
		if (!this.supported) return;
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		this.subscribed = subscription !== null;
	}

	async subscribe() {
		if (!this.supported || !VAPID_PUBLIC_KEY) return;
		this.loading = true;
		try {
			this.permission = await Notification.requestPermission();
			if (this.permission !== 'granted') return;

			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
			});

			const { data: userData } = await supabase.auth.getUser();
			const userId = userData.user?.id;
			if (!userId) return;

			const json = subscription.toJSON();
			await supabase.from('push_subscriptions').upsert(
				{
					user_id: userId,
					endpoint: json.endpoint,
					p256dh: json.keys?.p256dh,
					auth_key: json.keys?.auth
				},
				{ onConflict: 'user_id,endpoint' }
			);
			this.subscribed = true;
		} finally {
			this.loading = false;
		}
	}

	async unsubscribe() {
		if (!this.supported) return;
		this.loading = true;
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();
			if (subscription) {
				const endpoint = subscription.endpoint;
				await subscription.unsubscribe();
				await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
			}
			this.subscribed = false;
		} finally {
			this.loading = false;
		}
	}
}

export const pushState = new PushState();
