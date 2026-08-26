import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError, parseBody } from '@/lib/api';
import { listingCreateSchema } from '@/lib/validators';
import { serializeListing } from '@/lib/reeduca';
import { searchListings } from '@/lib/listings-query';

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const { items } = await searchListings(Object.fromEntries(url.searchParams));
		return NextResponse.json(items);
	} catch (err) {
		console.error('GET /api/listings', err);
		return jsonError('Não conseguimos carregar os anúncios agora.', 500);
	}
}

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para anunciar.', 401);

	const parsed = await parseBody(req, listingCreateSchema);
	if (parsed.error) return parsed.error;
	const data = parsed.data;

	const { data: user } = await supabase.from('users').select('name').eq('id', userId).single();

	try {
		const { data: created, error } = await supabase
			.from('listings')
			.insert({
				title: data.title,
				description: data.description || null,
				category: data.category,
				deal: data.deal,
				condition: data.condition,
				price: data.price ?? null,
				wanted: data.wanted || null,
				region: data.region || null,
				status: 'ativo',
				photo_urls: data.photoUrls?.length ? data.photoUrls : null,
				seller_name: user?.name || 'Estudante ReEduca',
				owner_id: userId,
			})
			.select('*, owner:users!owner_id(name)')
			.single();

		if (error) throw error;
		return NextResponse.json(serializeListing(created), { status: 201 });
	} catch (err) {
		console.error('POST /api/listings', err);
		return jsonError('Não foi possível salvar o anúncio.', 500);
	}
}
