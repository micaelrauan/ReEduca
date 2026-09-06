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

	const { data: listing, error } = await supabase.from('listings').select('*').eq('id', id).single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	// Get reports against this listing
	const { data: reports } = await supabase
		.from('reports')
		.select('id, reason, status, created_at')
		.eq('listing_id', id)
		.order('created_at', { ascending: false });

	return NextResponse.json({ listing, reports: reports || [] });
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { id } = await params;
	const body = await request.json();
	const { action } = body as { action: 'hide' | 'restore' | 'feature' | 'unfeature' };

	const userId = await getAuthUserId();

	if (action === 'hide') {
		const { error } = await supabase
			.from('listings')
			.update({ status: 'inativo' })
			.eq('id', id);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });

		if (userId) {
			await supabase.from('admin_actions').insert({
				admin_id: userId,
				action: 'hide_listing',
				target_type: 'listing',
				target_id: id,
				note: null,
			});
		}
	}

	if (action === 'restore') {
		const { error } = await supabase
			.from('listings')
			.update({ status: 'disponivel' })
			.eq('id', id);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });

		if (userId) {
			await supabase.from('admin_actions').insert({
				admin_id: userId,
				action: 'restore_listing',
				target_type: 'listing',
				target_id: id,
				note: null,
			});
		}
	}

	if (action === 'feature') {
		const { error } = await supabase
			.from('listings')
			.update({ featured: true })
			.eq('id', id);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });

		if (userId) {
			await supabase.from('admin_actions').insert({
				admin_id: userId,
				action: 'feature_listing',
				target_type: 'listing',
				target_id: id,
				note: null,
			});
		}
	}

	if (action === 'unfeature') {
		const { error } = await supabase
			.from('listings')
			.update({ featured: false })
			.eq('id', id);
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });

		if (userId) {
			await supabase.from('admin_actions').insert({
				admin_id: userId,
				action: 'unfeature_listing',
				target_type: 'listing',
				target_id: id,
				note: null,
			});
		}
	}

	return NextResponse.json({ ok: true });
}
