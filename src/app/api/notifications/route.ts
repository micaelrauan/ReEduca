import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError } from '@/lib/api';
import type { NotificationType } from '@/lib/reeduca';

export async function GET() {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para ver notificações.', 401);

	const { data: rows, error } = await supabase
		.from('notifications')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(50);

	if (error) throw error;

	return NextResponse.json(
		(rows ?? []).map((n) => ({
			id: n.id,
			type: n.type as NotificationType,
			message: n.message,
			listingId: n.listing_id,
			readAt: n.read_at,
			createdAt: n.created_at,
		})),
	);
}
