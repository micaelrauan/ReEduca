import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError, parseBody } from '@/lib/api';
import { ratingCreateSchema } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const url = new URL(req.url);
	const targetId = url.searchParams.get('userId');
	if (!targetId) return jsonError('Informe userId.', 422);

	const { data: ratings, error } = await supabase
		.from('ratings')
		.select('id, stars, comment, created_at, author:users!author_id(name, image_url)')
		.eq('target_id', targetId)
		.order('created_at', { ascending: false })
		.limit(50);

	if (error) throw error;

	const { count: total } = await supabase
		.from('ratings')
		.select('id', { count: 'exact', head: true })
		.eq('target_id', targetId);

	const avg =
		ratings && ratings.length
			? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
			: 0;

	return NextResponse.json({ ratings: ratings ?? [], avg, total: total ?? 0 });
}

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para avaliar.', 401);

	const rl = checkRateLimit(userId, { max: 10, windowMs: 300_000, key: 'rating' });
	if (!rl.ok) {
		return jsonError('Limite de avaliações atingido. Aguarde um pouco.', 429);
	}

	const parsed = await parseBody(req, ratingCreateSchema);
	if (parsed.error) return parsed.error;
	const { targetId, listingId, stars, comment } = parsed.data;

	if (targetId === userId) return jsonError('Não é possível avaliar a si mesmo.', 422);

	const [{ data: target }, { data: listing }] = await Promise.all([
		supabase.from('users').select('id').eq('id', targetId).single(),
		supabase.from('listings').select('id, owner_id').eq('id', listingId).single(),
	]);
	if (!target || !listing) return jsonError('Usuário ou anúncio não encontrado.', 404);
	if (listing.owner_id !== targetId) {
		return jsonError('Só é possível avaliar o dono do anúncio.', 422);
	}

	const { data: existing } = await supabase
		.from('ratings')
		.select('id')
		.eq('author_id', userId)
		.eq('target_id', targetId)
		.eq('listing_id', listingId)
		.maybeSingle();

	if (existing) {
		return jsonError('Você já avaliou este anunciante para este anúncio.', 409);
	}

	try {
		const { error } = await supabase
			.from('ratings')
			.insert({
				author_id: userId,
				target_id: targetId,
				listing_id: listingId,
				stars,
				comment: comment || null,
			});
		if (error) throw error;
		return NextResponse.json({ ok: true }, { status: 201 });
	} catch (err) {
		console.error('POST /api/ratings', err);
		return jsonError('Não foi possível salvar a avaliação.', 500);
	}
}
