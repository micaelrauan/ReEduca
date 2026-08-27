import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError, parseBody } from '@/lib/api';
import { z } from 'zod';

const markReadSchema = z.object({
	listingId: z.string().min(1),
	otherUserId: z.string().min(1),
});

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const parsed = await parseBody(req, markReadSchema);
	if (parsed.error) return parsed.error;
	const { listingId, otherUserId } = parsed.data;

	const { error } = await supabase
		.from('messages')
		.update({ read_at: new Date().toISOString() })
		.eq('listing_id', listingId)
		.eq('sender_id', otherUserId)
		.eq('recipient_id', userId)
		.is('read_at', null);

	if (error) throw error;

	return NextResponse.json({ ok: true });
}
