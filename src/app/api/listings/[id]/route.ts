import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUserId } from '@/lib/server-user';
import { jsonError, parseBody } from '@/lib/api';
import { listingUpdateSchema } from '@/lib/validators';
import { serializeListing, type ListingWithOwnerName } from '@/lib/reeduca';
import { deleteListingPhotos } from '@/lib/storage';
import type { Database } from '@/lib/supabase-types';

type RouteContext = { params: Promise<{ id: string }> };

async function findListing(id: string): Promise<ListingWithOwnerName | null> {
	const { data, error } = await supabase
		.from('listings')
		.select('*, owner:users!owner_id(name)')
		.eq('id', id)
		.single();
	if (error || !data) return null;
	return data as ListingWithOwnerName;
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
	if (listing.owner_id !== userId) return jsonError('Este anúncio não é seu.', 403);

	const parsed = await parseBody(req, listingUpdateSchema);
	if (parsed.error) return parsed.error;
	const data = parsed.data;

	const updateData: Database['public']['Tables']['listings']['Update'] = {};
	if (data.title !== undefined) updateData.title = data.title;
	if (data.description !== undefined) updateData.description = data.description || null;
	if (data.category !== undefined) updateData.category = data.category;
	if (data.deal !== undefined) updateData.deal = data.deal;
	if (data.condition !== undefined) updateData.condition = data.condition;
	if (data.price !== undefined) updateData.price = data.price;
	if (data.wanted !== undefined) updateData.wanted = data.wanted || null;
	if (data.region !== undefined) updateData.region = data.region || null;
	if (data.status !== undefined) updateData.status = data.status;
	if (data.photoUrls !== undefined) {
		updateData.photo_urls = data.photoUrls.length ? data.photoUrls : null;
	}

	try {
		const { data: updated, error } = await supabase
			.from('listings')
			.update(updateData)
			.eq('id', id)
			.select('*, owner:users!owner_id(name)')
			.single();

		if (error) throw error;
		return NextResponse.json(serializeListing(updated as ListingWithOwnerName));
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
	if (listing.owner_id !== userId) return jsonError('Este anúncio não é seu.', 403);

	try {
		await deleteListingPhotos(id).catch((err) =>
			console.error('Erro ao limpar fotos do Storage:', err),
		);

		const { error } = await supabase.from('listings').delete().eq('id', id);
		if (error) throw error;
		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error(`DELETE /api/listings/${id}`, err);
		return jsonError('Não foi possível excluir o anúncio.', 500);
	}
}
