import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError } from '@/lib/api';

export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para bloquear usuários.', 401);

	const { id: blockedId } = await params;
	if (blockedId === userId) return jsonError('Não é possível bloquear a si mesmo.', 422);

	const { data: existing } = await supabase
		.from('blocked_users')
		.select('blocker_id')
		.eq('blocker_id', userId)
		.eq('blocked_id', blockedId)
		.single();

	if (existing) return jsonError('Usuário já bloqueado.', 409);

	const { error } = await supabase
		.from('blocked_users')
		.insert({ blocker_id: userId, blocked_id: blockedId });

	if (error) throw error;

	return NextResponse.json({ ok: true });
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const { id: blockedId } = await params;

	const { error } = await supabase
		.from('blocked_users')
		.delete()
		.eq('blocker_id', userId)
		.eq('blocked_id', blockedId);

	if (error) throw error;

	return NextResponse.json({ ok: true });
}
