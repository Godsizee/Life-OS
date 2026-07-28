// LifeOS W4 — Reminder-Dispatch.
// Aufruf: POST, Header `x-lifeos-token: <LIFEOS_INTAKE_TOKEN>`
// Body optional: { "limit": 50, "cleanup": true }
// Ablauf: claim_due_reminders() (claim-then-send) -> Web-Push je Geraet des
// Empfaengers -> tote Endpoints (404/410) loeschen.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as webpush from 'jsr:@negrel/webpush';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SHARED_TOKEN = Deno.env.get('LIFEOS_INTAKE_TOKEN') ?? '';
const VAPID_KEYS_JWK = Deno.env.get('VAPID_KEYS_JWK') ?? '';
const VAPID_CONTACT = Deno.env.get('VAPID_CONTACT') ?? 'mailto:admin@life-os.local';

interface ReminderRow {
	id: string;
	user_id: string;
	title: string;
	body: string | null;
	url: string;
}

interface SubscriptionRow {
	id: string;
	user_id: string;
	endpoint: string;
	p256dh: string;
	auth_key: string;
}

function json(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

let appServerPromise: Promise<unknown> | null = null;

function getAppServer() {
	if (!appServerPromise) {
		appServerPromise = (async () => {
			const keys = await webpush.importVapidKeys(JSON.parse(VAPID_KEYS_JWK), {
				extractable: false
			});
			return await webpush.ApplicationServer.new({
				contactInformation: VAPID_CONTACT,
				vapidKeys: keys
			});
		})();
	}
	return appServerPromise;
}

/**
 * Einziger Ort, der die Push-Library kennt. Weicht die JSR-Signatur ab, ist NUR
 * diese Funktion anzupassen.
 */
async function sendPush(
	sub: SubscriptionRow,
	payload: { title: string; body: string; url: string }
): Promise<'ok' | 'gone' | 'error'> {
	try {
		// deno-lint-ignore no-explicit-any
		const server = (await getAppServer()) as any;
		const subscriber = server.subscribe({
			endpoint: sub.endpoint,
			keys: { p256dh: sub.p256dh, auth: sub.auth_key }
		});
		await subscriber.pushTextMessage(JSON.stringify(payload), {});
		return 'ok';
	} catch (err) {
		const status = (err as { response?: { status?: number } })?.response?.status;
		if (status === 404 || status === 410) return 'gone';
		console.error('push failed', sub.endpoint.slice(0, 48), err);
		return 'error';
	}
}

Deno.serve(async (req) => {
	if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
	if (!SHARED_TOKEN || req.headers.get('x-lifeos-token') !== SHARED_TOKEN) {
		return json({ error: 'unauthorized' }, 401);
	}
	if (!VAPID_KEYS_JWK) return json({ error: 'VAPID_KEYS_JWK missing' }, 500);

	let options: { limit?: number; cleanup?: boolean } = {};
	try {
		options = await req.json();
	} catch {
		options = {};
	}

	const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});

	let cleaned = 0;
	if (options.cleanup) {
		const { data } = await supabase.rpc('cleanup_orphan_reminders');
		cleaned = typeof data === 'number' ? data : 0;
	}

	const { data: claimed, error } = await supabase.rpc('claim_due_reminders', {
		p_limit: options.limit ?? 50
	});
	if (error) return json({ error: error.message }, 500);

	const reminders = (claimed ?? []) as ReminderRow[];
	if (reminders.length === 0) return json({ claimed: 0, sent: 0, removed: 0, cleaned });

	const userIds = [...new Set(reminders.map((r) => r.user_id))];
	const { data: subsData } = await supabase
		.from('push_subscriptions')
		.select('id, user_id, endpoint, p256dh, auth_key')
		.in('user_id', userIds);

	const byUser = new Map<string, SubscriptionRow[]>();
	for (const sub of (subsData ?? []) as SubscriptionRow[]) {
		byUser.set(sub.user_id, [...(byUser.get(sub.user_id) ?? []), sub]);
	}

	let sent = 0;
	const stale: string[] = [];
	for (const reminder of reminders) {
		const payload = {
			title: reminder.title,
			body: reminder.body ?? '',
			url: reminder.url || '/'
		};
		for (const sub of byUser.get(reminder.user_id) ?? []) {
			const result = await sendPush(sub, payload);
			if (result === 'ok') sent++;
			else if (result === 'gone') stale.push(sub.id);
		}
	}

	if (stale.length > 0) {
		await supabase.from('push_subscriptions').delete().in('id', stale);
	}

	return json({
		claimed: reminders.length,
		sent,
		removed: stale.length,
		cleaned
	});
});
