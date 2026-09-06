import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/server-user';

export async function GET(request: NextRequest) {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { searchParams } = new URL(request.url);
	const status = searchParams.get('status');
	const kind = searchParams.get('kind');

	let query = supabase
		.from('reports')
		.select('*, reporter:users!reports_reporter_id_fkey(id,name), listing:listings!reports_listing_id_fkey(id,title)')
		.order('created_at', { ascending: false });

	if (status && status !== 'all') query = query.eq('status', status);
	if (kind && kind !== 'all') query = query.eq('kind', kind);

	const { data, error } = await query;
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	return NextResponse.json({ reports: data });
}
