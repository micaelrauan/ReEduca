import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError } from '@/lib/api';

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const { notificationId } = await req.json();
	if (!notificationId) return jsonError('ID da notificação obrigatório.', 422);

	const { error } = await supabase
		.from('notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('id', notificationId)
		.eq('user_id', userId);

	if (error) throw error;

	return NextResponse.json({ ok: true });
}

export async function PATCH() {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const { error } = await supabase
		.from('notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('user_id', userId)
		.is('read_at', null);

	if (error) throw error;

	return NextResponse.json({ ok: true });
}
