import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/server-user';

export async function GET(request: NextRequest) {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { searchParams } = new URL(request.url);
	const search = searchParams.get('search');
	const status = searchParams.get('status');
	const category = searchParams.get('category');
	const featured = searchParams.get('featured');

	let query = supabase
		.from('listings')
		.select('*')
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (search) query = query.ilike('title', `%${search}%`);
	if (status && status !== 'all') query = query.eq('status', status);
	if (category && category !== 'all') query = query.eq('category', category);
	if (featured === 'true') query = query.eq('featured', true);
	if (featured === 'false') query = query.eq('featured', false);

	const { data, error } = await query;
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	return NextResponse.json({ listings: data });
}
