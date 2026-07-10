import { env } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

if (typeof process !== 'undefined' && process.env) {
	console.log('[SUPABASE DEBUG] Available process.env keys starting with VITE_ or SUPABASE_:', 
		Object.keys(process.env).filter(key => key.startsWith('VITE_') || key.includes('SUPABASE') || key.includes('VAPID'))
	);
}
console.log('[SUPABASE DEBUG] env.VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL);

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Initialize the Supabase client.
// In a real environment, you must provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
