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

	const { data, error } = await supabase
		.from('reports')
		.select('*, reporter:users!reports_reporter_id_fkey(id,name,email), listing:listings!reports_listing_id_fkey(id,title,category,status)')
		.eq('id', id)
		.single();

	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ report: data });
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { id } = await params;
	const body = await request.json();
	const { status, note, action, actionNote } = body as {
		status?: string;
		note?: string;
		action?: 'dismiss' | 'hide_listing' | 'ban_user';
		actionNote?: string;
	};

	const userId = await getAuthUserId();

	// Update report status
	if (status) {
		const { error } = await supabase
			.from('reports')
			.update({ status, note: note ?? undefined, reviewed_by: userId, reviewed_at: new Date().toISOString() })
			.eq('id', id);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	}

	// Execute action
	if (action) {
		const { data: report } = await supabase.from('reports').select('listing_id, reporter_id').eq('id', id).single();

		if (action === 'hide_listing' && report?.listing_id && userId) {
			await supabase.from('listings').update({ status: 'inativo' }).eq('id', report.listing_id);
			await supabase.from('admin_actions').insert({
				admin_id: userId,
				action: 'hide_listing',
				target_type: 'listing',
				target_id: report.listing_id,
				note: actionNote || null,
			});
		}

		if (action === 'ban_user' && report?.reporter_id && userId) {
			await supabase.from('users').update({ banned_at: new Date().toISOString(), ban_reason: actionNote || 'Denúncia viola políticas' }).eq('id', report.reporter_id);
			await supabase.from('admin_actions').insert({
				admin_id: userId,
				action: 'ban_user',
				target_type: 'user',
				target_id: report.reporter_id,
				note: actionNote || null,
			});
		}

		if (action === 'dismiss' && userId) {
			await supabase.from('admin_actions').insert({
				admin_id: userId,
				action: 'dismiss_report',
				target_type: 'report',
				target_id: id,
				note: actionNote || null,
			});
		}
	}

	return NextResponse.json({ ok: true });
}
