import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError } from '@/lib/api';

export async function POST() {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const { error } = await supabase
		.from('users')
		.update({ last_seen_at: new Date().toISOString() })
		.eq('id', userId);

	if (error) throw error;

	return NextResponse.json({ ok: true });
}
