import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

	const [target, listing] = await Promise.all([
		db.user.findUnique({ where: { id: targetId } }),
		db.listing.findUnique({ where: { id: listingId } }),
	]);
	if (!target || !listing) return jsonError('Usuário ou anúncio não encontrado.', 404);

	try {
		const created = await db.rating.create({
			data: { stars, comment: comment || null, authorId: userId, targetId, listingId },
		});
		return NextResponse.json({ id: created.id }, { status: 201 });
	} catch (err) {
		console.error('POST /api/ratings', err);
		return jsonError('Não foi possível enviar a avaliação.', 500);
	}
}
