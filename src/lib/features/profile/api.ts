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

export async function updateSettings(userId: string, settings: ProfileSettings): Promise<void> {
	const { error } = await supabase.from('profiles').update({ settings }).eq('user_id', userId);
	if (error) throw error;
}
