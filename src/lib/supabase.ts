import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const globalForSupabase = globalThis as unknown as {
	supabase?: SupabaseClient<Database>;
};

function getSupabaseClient(): SupabaseClient<Database> {
	if (globalForSupabase.supabase) return globalForSupabase.supabase;

	const supabaseUrl = process.env.SUPABASE_URL;
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseServiceKey) {
		throw new Error(
			'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.',
		);
	}

	const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = client;
	return client;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
	get(_target, prop) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (getSupabaseClient() as any)[prop];
	},
});
