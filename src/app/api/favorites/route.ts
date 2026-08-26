import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError, parseBody, firstParam } from '@/lib/api';
import { favoriteActionSchema } from '@/lib/validators';
import { serializeListing, type ListingWithOwnerName } from '@/lib/reeduca';

export async function GET() {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para ver favoritos.', 401);

	const { data, error } = await supabase
		.from('favorites')
		.select('listing:listings(*, owner:users!owner_id(name))')
		.eq('owner_id', userId)
		.order('created_at', { ascending: false });

	if (error) throw error;

	const listings = (data ?? [])
		.map((f) => f.listing)
		.filter(Boolean)
		.map((l) => serializeListing(l as ListingWithOwnerName));

	return NextResponse.json(listings);
}

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para salvar favoritos.', 401);

	const parsed = await parseBody(req, favoriteActionSchema);
	if (parsed.error) return parsed.error;

	const { data: listing } = await supabase
		.from('listings')
		.select('id')
		.eq('id', parsed.data.listingId)
		.single();
	if (!listing) return jsonError('Anúncio não encontrado.', 404);

	const { error } = await supabase.from('favorites').upsert({
		owner_id: userId,
		listing_id: parsed.data.listingId,
	});
	if (error) throw error;

	return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const url = new URL(req.url);
	const listingId = firstParam(url.searchParams.get('listingId') ?? undefined);
	if (!listingId) return jsonError('listingId obrigatório.', 422);

	const { error } = await supabase
		.from('favorites')
		.delete()
		.eq('owner_id', userId)
		.eq('listing_id', listingId);
	if (error) throw error;

	return NextResponse.json({ ok: true });
}
