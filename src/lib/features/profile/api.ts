import { supabase } from '$lib/core/supabase';
import type { ProfileSettings } from './types';

export async function getSettings(userId: string): Promise<ProfileSettings> {
	const { data, error } = await supabase
		.from('profiles')
		.select('settings')
		.eq('user_id', userId)
		.single();
	if (error) throw error;
	return (data?.settings as ProfileSettings) ?? {};
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
