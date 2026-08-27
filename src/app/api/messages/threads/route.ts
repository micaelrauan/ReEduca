import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError } from '@/lib/api';

export type ThreadSummary = {
	key: string;
	listingId: string;
	listingTitle: string;
	otherId: string;
	otherName: string;
	last: string;
	unread: number;
};

export async function GET() {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para ver conversas.', 401);

	const { data: rows, error } = await supabase
		.from('messages')
		.select('*, listing:listings(title), sender:users!sender_id(name), recipient:users!recipient_id(name)')
		.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
		.order('created_at', { ascending: false })
		.limit(500);

	if (error) throw error;

	const map = new Map<string, ThreadSummary>();
	for (const m of rows ?? []) {
		if (!m.listing_id) continue;
		const isSender = m.sender_id === userId;
		const other = isSender ? m.recipient_id : m.sender_id;
		const key = `${m.listing_id}-${other}`;
		const existing = map.get(key);
		if (existing) {
			existing.unread += !isSender && !m.read_at ? 1 : 0;
			continue;
		}
		map.set(key, {
			key,
			listingId: m.listing_id,
			listingTitle: (m.listing as { title: string } | null)?.title || 'Anúncio',
			otherId: other,
			otherName: ((isSender ? m.recipient : m.sender) as { name: string | null } | null)?.name || 'Estudante',
			last: m.text,
			unread: !isSender && !m.read_at ? 1 : 0,
		});
	}

	return NextResponse.json([...map.values()]);
}
