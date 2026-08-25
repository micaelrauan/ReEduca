import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

	const rows = await db.message.findMany({
		where: {
			listingId,
			AND: [
				{ senderId: { in: [userId, otherId] } },
				{ recipientId: { in: [userId, otherId] } },
			],
		},
		orderBy: { createdAt: 'asc' as const },
		take: 500,
	});

	return NextResponse.json(
		rows.map((m) => ({
			id: m.id,
			text: m.text,
			senderId: m.senderId,
			listingId: m.listingId,
			createdAt: m.createdAt.toISOString(),
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

	const [recipient, listing] = await Promise.all([
		db.user.findUnique({ where: { id: recipientId } }),
		db.listing.findUnique({ where: { id: listingId } }),
	]);
	if (!recipient || !listing) return jsonError('Destinatário ou anúncio não encontrado.', 404);

	try {
		const created = await db.message.create({
			data: { text, senderId: userId, recipientId, listingId },
		});
		return NextResponse.json(
			{
				id: created.id,
				text: created.text,
				senderId: created.senderId,
				listingId: created.listingId,
				createdAt: created.createdAt.toISOString(),
			},
			{ status: 201 },
		);
	} catch (err) {
		console.error('POST /api/messages', err);
		return jsonError('Mensagem não enviada. Tente de novo.', 500);
	}
}
