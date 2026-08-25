import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError } from '@/lib/api';

export type ThreadSummary = {
	key: string;
	listingId: string;
	listingTitle: string;
	otherId: string;
	otherName: string;
	last: string;
};

export async function GET() {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para ver conversas.', 401);

	const rows = await db.message.findMany({
		where: { OR: [{ senderId: userId }, { recipientId: userId }] },
		orderBy: { createdAt: 'desc' as const },
		take: 500,
		include: {
			listing: { select: { title: true } },
			sender: { select: { name: true } },
			recipient: { select: { name: true } },
		},
	});

	const map = new Map<string, ThreadSummary>();
	for (const m of rows) {
		if (!m.listingId) continue;
		const isSender = m.senderId === userId;
		const other = isSender ? m.recipientId : m.senderId;
		const key = `${m.listingId}-${other}`;
		if (map.has(key)) continue;
		map.set(key, {
			key,
			listingId: m.listingId,
			listingTitle: m.listing?.title || 'Anúncio',
			otherId: other,
			otherName: (isSender ? m.recipient?.name : m.sender?.name) || 'Estudante',
			last: m.text,
		});
	}

	return NextResponse.json([...map.values()]);
}
