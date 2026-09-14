import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError } from '@/lib/api';

export async function GET() {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const { count, error } = await supabase
		.from('notifications')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId)
		.is('read_at', null);

	if (error) throw error;

	return NextResponse.json({ count: count ?? 0 });
}
