import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError, parseBody, firstParam } from '@/lib/api';
import { messageSendSchema } from '@/lib/validators';

export async function GET(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para ver conversas.', 401);

	const url = new URL(req.url);
	const listingId = firstParam(url.searchParams.get('listingId') ?? undefined);
	const otherId = firstParam(url.searchParams.get('userId') ?? undefined);
	if (!listingId || !otherId) {
		return jsonError('Informe listingId e userId da conversa.', 422);
	}
	if (otherId === userId) return jsonError('Conversa inválida.', 422);

	const { data: rows, error } = await supabase
		.from('messages')
		.select('*')
		.eq('listing_id', listingId)
		.or(`and(sender_id.in.(${userId},${otherId}),recipient_id.in.(${userId},${otherId}))`)
		.order('created_at', { ascending: true })
		.limit(500);

	if (error) throw error;

	return NextResponse.json(
		(rows ?? []).map((m) => ({
			id: m.id,
			text: m.text,
			senderId: m.sender_id,
			listingId: m.listing_id,
			createdAt: m.created_at,
		})),
	);
}

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para enviar mensagens.', 401);

	const parsed = await parseBody(req, messageSendSchema);
	if (parsed.error) return parsed.error;
	const { recipientId, listingId, text } = parsed.data;

	if (recipientId === userId) return jsonError('Não é possível conversar consigo mesmo.', 422);

	const [{ data: recipient }, { data: listing }] = await Promise.all([
		supabase.from('users').select('id').eq('id', recipientId).single(),
		supabase.from('listings').select('id').eq('id', listingId).single(),
	]);
	if (!recipient || !listing) return jsonError('Destinatário ou anúncio não encontrado.', 404);

	try {
		const { data: created, error } = await supabase
			.from('messages')
			.insert({ text, sender_id: userId, recipient_id: recipientId, listing_id: listingId })
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json(
			{
				id: created.id,
				text: created.text,
				senderId: created.sender_id,
				listingId: created.listing_id,
				createdAt: created.created_at,
			},
			{ status: 201 },
		);
	} catch (err) {
		console.error('POST /api/messages', err);
		return jsonError('Mensagem não enviada. Tente de novo.', 500);
	}
}
