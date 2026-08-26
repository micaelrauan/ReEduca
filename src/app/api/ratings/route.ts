import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError, parseBody } from '@/lib/api';
import { ratingCreateSchema } from '@/lib/validators';

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para avaliar.', 401);

	const parsed = await parseBody(req, ratingCreateSchema);
	if (parsed.error) return parsed.error;
	const { targetId, listingId, stars, comment } = parsed.data;

	if (targetId === userId) return jsonError('Você não pode avaliar a si mesmo.', 422);

	const [{ data: target }, { data: listing }] = await Promise.all([
		supabase.from('users').select('id').eq('id', targetId).single(),
		supabase.from('listings').select('id').eq('id', listingId).single(),
	]);
	if (!target || !listing) return jsonError('Usuário ou anúncio não encontrado.', 404);

	try {
		const { data: created, error } = await supabase
			.from('ratings')
			.insert({ stars, comment: comment || null, author_id: userId, target_id: targetId, listing_id: listingId })
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json({ id: created.id }, { status: 201 });
	} catch (err) {
		console.error('POST /api/ratings', err);
		return jsonError('Não foi possível enviar a avaliação.', 500);
	}
}
