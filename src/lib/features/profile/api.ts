import { supabase } from '$lib/core/supabase';
import type { ProfileSettings } from './types';

export interface ProfileRow {
	display_name: string | null;
	settings: ProfileSettings;
}

export async function getProfile(userId: string): Promise<ProfileRow> {
	const { data, error } = await supabase
		.from('profiles')
		.select('display_name, settings')
		.eq('user_id', userId)
		.single();
	if (error) throw error;
	return {
		display_name: data?.display_name ?? null,
		settings: (data?.settings as ProfileSettings) ?? {}
	};
}

/** Der Trigger `handle_new_user` setzt anfangs die E-Mail als Anzeigename — das Onboarding ersetzt sie. */
export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
	const { error } = await supabase
		.from('profiles')
		.update({ display_name: displayName })
		.eq('user_id', userId);
	if (error) throw error;
}

/**
 * Nur die uebergebenen Keys setzen, der Rest bleibt stehen.
 *
 * Vorher ging hier das komplette settings-Objekt raus. Zwei Geraete kurz
 * nacheinander — oder eine spaet abgespielte Outbox-Mutation — machten damit
 * fremde Aenderungen rueckgaengig. Die Zusammenfuehrung passiert serverseitig
 * (Migration 32), weil nur dort der aktuelle Stand bekannt ist.
 */
export async function mergeSettings(patch: Partial<ProfileSettings>): Promise<void> {
	const { error } = await supabase.rpc('merge_profile_settings', { patch });
	if (error) throw error;
}
