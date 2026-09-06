import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/server-user';

export async function GET() {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	// Get all unique conversations (listing_id + sender/recipient pairs)
	const { data: messages, error } = await supabase
		.from('messages')
		.select('id, sender_id, recipient_id, listing_id, text, created_at, read_at')
		.order('created_at', { ascending: false });

	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	// Group by conversation (listing_id + sorted user pair)
	const conversations = new Map<string, {
		listing_id: string | null;
		user1: string;
		user2: string;
		last_message: string;
		last_message_at: string;
		unread_count: number;
	}>();

	for (const msg of messages || []) {
		if (!msg.listing_id) continue;

		const [u1, u2] = [msg.sender_id, msg.recipient_id].sort();
		const key = `${msg.listing_id}:${u1}:${u2}`;

		if (!conversations.has(key)) {
			conversations.set(key, {
				listing_id: msg.listing_id,
				user1: u1,
				user2: u2,
				last_message: msg.text,
				last_message_at: msg.created_at,
				unread_count: 0,
			});
		}

		const conv = conversations.get(key)!;
		if (!msg.read_at && msg.sender_id !== u1) {
			conv.unread_count++;
		}
	}

	// Get user names and listing titles
	const userIds = new Set<string>();
	const listingIds = new Set<string>();
	for (const conv of conversations.values()) {
		userIds.add(conv.user1);
		userIds.add(conv.user2);
		if (conv.listing_id) listingIds.add(conv.listing_id);
	}

	const [usersResult, listingsResult] = await Promise.all([
		supabase.from('users').select('id, name, email').in('id', [...userIds]),
		supabase.from('listings').select('id, title').in('id', [...listingIds]),
	]);

	const usersMap = new Map((usersResult.data || []).map(u => [u.id, u]));
	const listingsMap = new Map((listingsResult.data || []).map(l => [l.id, l]));

	const result = [...conversations.values()].map(conv => ({
		...conv,
		user1_name: usersMap.get(conv.user1)?.name || usersMap.get(conv.user1)?.email || 'Desconhecido',
		user2_name: usersMap.get(conv.user2)?.name || usersMap.get(conv.user2)?.email || 'Desconhecido',
		listing_title: listingsMap.get(conv.listing_id || '')?.title || 'Anúncio removido',
	})).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

	return NextResponse.json({ conversations: result });
}
