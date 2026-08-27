import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';

export async function GET() {
	const userId = await ensureMirroredUser();
	if (!userId) return NextResponse.json({ count: 0 });

	const { count } = await supabase
		.from('messages')
		.select('id', { count: 'exact', head: true })
		.eq('recipient_id', userId)
		.is('read_at', null);

	return NextResponse.json({ count: count ?? 0 });
}
