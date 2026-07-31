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

export async function getSettings(userId: string): Promise<ProfileSettings> {
	const p = await getProfile(userId);
	return p.settings;
}

/** Der Trigger `handle_new_user` setzt anfangs die E-Mail als Anzeigename — das Onboarding ersetzt sie. */
export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
	const { error } = await supabase
		.from('profiles')
		.update({ display_name: displayName })
		.eq('user_id', userId);
	if (error) throw error;
}

export async function updateSettings(userId: string, settings: ProfileSettings): Promise<void> {
	const { error } = await supabase.from('profiles').update({ settings }).eq('user_id', userId);
	if (error) throw error;
}
