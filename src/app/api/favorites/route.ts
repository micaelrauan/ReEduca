import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError, parseBody, firstParam } from '@/lib/api';
import { favoriteActionSchema } from '@/lib/validators';
import { serializeListing } from '@/lib/reeduca';

export async function GET() {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para ver favoritos.', 401);

	const rows = await db.favorite.findMany({
		where: { ownerId: userId },
		orderBy: { createdAt: 'desc' },
		include: { listing: { include: { owner: { select: { name: true } } } } },
	});
	return NextResponse.json(rows.map((f) => serializeListing(f.listing)));
}

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para salvar favoritos.', 401);

	const parsed = await parseBody(req, favoriteActionSchema);
	if (parsed.error) return parsed.error;

	const listing = await db.listing.findUnique({ where: { id: parsed.data.listingId } });
	if (!listing) return jsonError('Anúncio não encontrado.', 404);

	await db.favorite.upsert({
		where: { ownerId_listingId: { ownerId: userId, listingId: parsed.data.listingId } },
		update: {},
		create: { ownerId: userId, listingId: parsed.data.listingId },
	});
	return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const url = new URL(req.url);
	const listingId = firstParam(url.searchParams.get('listingId') ?? undefined);
	if (!listingId) return jsonError('listingId obrigatório.', 422);

	await db.favorite.deleteMany({ where: { ownerId: userId, listingId } });
	return NextResponse.json({ ok: true });
}
