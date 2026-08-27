import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError } from '@/lib/api';

export async function GET(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const url = new URL(req.url);
	const targetId = url.searchParams.get('userId');
	if (!targetId) return jsonError('Informe userId.', 422);

	const { data } = await supabase
		.from('users')
		.select('last_seen_at')
		.eq('id', targetId)
		.single();

	const lastSeen = data?.last_seen_at;
	const isOnline = lastSeen
		? Date.now() - new Date(lastSeen).getTime() < 60_000
		: false;

	return NextResponse.json({ online: isOnline, lastSeen });
}
