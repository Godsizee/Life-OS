import { supabase } from '$lib/core/supabase';
import { fetchAllPages } from '$lib/core/query';
import type { Reminder } from './types';

// ── Push-Subscriptions (Zustellkanal der Erinnerungen) ──────────────────────
// Liegt hier statt in core/push.svelte.ts: der Supabase-Client gehoert laut
// AGENTS.md ausschliesslich in die api.ts des Features.

export interface PushSubscriptionRow {
	user_id: string;
	endpoint: string;
	p256dh: string;
	auth_key: string;
}

export async function upsertPushSubscription(row: PushSubscriptionRow): Promise<void> {
	const { error } = await supabase
		.from('push_subscriptions')
		.upsert(row, { onConflict: 'user_id,endpoint' });
	if (error) throw error;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
	const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
	if (error) throw error;
}

export async function listReminders(workspaceId: string): Promise<Reminder[]> {
	return fetchAllPages<Reminder>('reminders', (from, to) =>
		supabase
			.from('reminders')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('remind_at')
			.order('id')
			.range(from, to)
	);
}

export async function insertRaw(reminder: Reminder): Promise<Reminder> {
	const { data, error } = await supabase.from('reminders').upsert(reminder).select().single();
	if (error) throw error;
	return data;
}

export async function updateRaw(patch: Partial<Reminder> & { id: string }): Promise<Reminder> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('reminders')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteReminder(id: string): Promise<void> {
	const { error } = await supabase.from('reminders').delete().eq('id', id);
	if (error) throw error;
}
