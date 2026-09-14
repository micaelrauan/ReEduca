import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError } from '@/lib/api';

const RENEWAL_DAYS = 30;

export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para renovar anúncios.', 401);

	const { id } = await params;

	const { data: listing, error: fetchErr } = await supabase
		.from('listings')
		.select('id, owner_id')
		.eq('id', id)
		.single();

	if (fetchErr || !listing) return jsonError('Anúncio não encontrado.', 404);
	if (listing.owner_id !== userId) return jsonError('Sem permissão.', 403);

	const newExpiresAt = new Date();
	newExpiresAt.setDate(newExpiresAt.getDate() + RENEWAL_DAYS);

	const { error } = await supabase
		.from('listings')
		.update({ expires_at: newExpiresAt.toISOString() })
		.eq('id', id);

	if (error) throw error;

	return NextResponse.json({ ok: true, expires_at: newExpiresAt.toISOString() });
}
