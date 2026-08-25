import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/server-user';
import { jsonError, parseBody } from '@/lib/api';
import { listingUpdateSchema } from '@/lib/validators';
import { serializeListing } from '@/lib/reeduca';

type RouteContext = { params: Promise<{ id: string }> };

async function findListing(id: string) {
	return db.listing.findUnique({
		where: { id },
		include: { owner: { select: { name: true } } },
	});
}

export async function GET(_req: Request, ctx: RouteContext) {
	const { id } = await ctx.params;
	const listing = await findListing(id);
	if (!listing) return jsonError('Anúncio não encontrado.', 404);
	return NextResponse.json(serializeListing(listing));
}

export async function PATCH(req: Request, ctx: RouteContext) {
	const userId = await getAuthUserId();
	if (!userId) return jsonError('Faça login para editar anúncios.', 401);

	const { id } = await ctx.params;
	const listing = await findListing(id);
	if (!listing) return jsonError('Anúncio não encontrado.', 404);
	if (listing.ownerId !== userId) return jsonError('Este anúncio não é seu.', 403);

	const parsed = await parseBody(req, listingUpdateSchema);
	if (parsed.error) return parsed.error;
	const data = parsed.data;

	try {
		const updated = await db.listing.update({
			where: { id },
			data: {
				title: data.title,
				description: data.description === undefined ? undefined : data.description || null,
				category: data.category,
				deal: data.deal,
				condition: data.condition,
				price: data.price === undefined ? undefined : data.price,
				wanted: data.wanted === undefined ? undefined : data.wanted || null,
				region: data.region === undefined ? undefined : data.region || null,
				status: data.status,
				photoUrls:
					data.photoUrls === undefined
						? undefined
						: data.photoUrls.length
							? data.photoUrls
							: Prisma.JsonNull,
			},
			include: { owner: { select: { name: true } } },
		});
		return NextResponse.json(serializeListing(updated));
	} catch (err) {
		console.error(`PATCH /api/listings/${id}`, err);
		return jsonError('Não foi possível salvar o anúncio.', 500);
	}
}

export async function DELETE(_req: Request, ctx: RouteContext) {
	const userId = await getAuthUserId();
	if (!userId) return jsonError('Faça login.', 401);

	const { id } = await ctx.params;
	const listing = await findListing(id);
	if (!listing) return jsonError('Anúncio não encontrado.', 404);
	if (listing.ownerId !== userId) return jsonError('Este anúncio não é seu.', 403);

	try {
		await db.listing.delete({ where: { id } });
		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error(`DELETE /api/listings/${id}`, err);
		return jsonError('Não foi possível excluir o anúncio.', 500);
	}
}
