import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/server-user';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ listingId: string; userId: string }> },
) {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { listingId, userId } = await params;

	// Get messages between these two users for this listing
	const { data: messages, error } = await supabase
		.from('messages')
		.select('*')
		.eq('listing_id', listingId)
		.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
		.order('created_at', { ascending: true });

	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	// Get user names
	const userIds = new Set<string>();
	for (const msg of messages || []) {
		userIds.add(msg.sender_id);
		userIds.add(msg.recipient_id);
	}

	const { data: users } = await supabase
		.from('users')
		.select('id, name, email')
		.in('id', [...userIds]);

	const usersMap = new Map((users || []).map(u => [u.id, u]));

	const result = (messages || []).map(msg => ({
		...msg,
		sender_name: usersMap.get(msg.sender_id)?.name || usersMap.get(msg.sender_id)?.email || 'Desconhecido',
		recipient_name: usersMap.get(msg.recipient_id)?.name || usersMap.get(msg.recipient_id)?.email || 'Desconhecido',
	}));

	return NextResponse.json({ messages: result });
}
