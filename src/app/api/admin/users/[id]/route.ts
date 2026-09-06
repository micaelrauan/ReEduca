import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin, getAuthUserId } from '@/lib/server-user';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { id } = await params;

	const { data: user, error } = await supabase.from('users').select('*').eq('id', id).single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	// Get stats
	const [listingsCount, reportsCount, messagesCount] = await Promise.all([
		supabase.from('listings').select('id', { count: 'exact', head: true }).eq('owner_id', id),
		supabase.from('reports').select('id', { count: 'exact', head: true }).eq('reporter_id', id),
		supabase.from('messages').select('id', { count: 'exact', head: true }).or(`sender_id.eq.${id},recipient_id.eq.${id}`),
	]);

	return NextResponse.json({
		user,
		stats: {
			listings: listingsCount.count ?? 0,
			reports: reportsCount.count ?? 0,
			messages: messagesCount.count ?? 0,
		},
	});
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { id } = await params;
	const body = await request.json();
	const { action, banReason } = body as {
		action?: 'ban' | 'unban' | 'promote' | 'demote';
		banReason?: string;
	};

	const userId = await getAuthUserId();

	if (action === 'ban') {
		const { error } = await supabase
			.from('users')
			.update({ banned_at: new Date().toISOString(), ban_reason: banReason || null })
			.eq('id', id);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });

		if (userId) {
			await supabase.from('admin_actions').insert({
				admin_id: userId,
				action: 'ban_user',
				target_type: 'user',
				target_id: id,
				note: banReason || null,
			});
		}
	}

	if (action === 'unban') {
		const { error } = await supabase
			.from('users')
			.update({ banned_at: null, ban_reason: null })
			.eq('id', id);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });

		if (userId) {
			await supabase.from('admin_actions').insert({
				admin_id: userId,
				action: 'unban_user',
				target_type: 'user',
				target_id: id,
				note: null,
			});
		}
	}

	if (action === 'promote' || action === 'demote') {
		const newRole = action === 'promote' ? 'admin' : 'user';
		const { error } = await supabase.from('users').update({ role: newRole }).eq('id', id);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });

		if (userId) {
			await supabase.from('admin_actions').insert({
				admin_id: userId,
				action: `${action}_user`,
				target_type: 'user',
				target_id: id,
				note: null,
			});
		}
	}

	return NextResponse.json({ ok: true });
}
