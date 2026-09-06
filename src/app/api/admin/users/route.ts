import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/server-user';

export async function GET(request: NextRequest) {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { searchParams } = new URL(request.url);
	const search = searchParams.get('search');
	const role = searchParams.get('role');
	const banned = searchParams.get('banned');

	let query = supabase
		.from('users')
		.select('*')
		.order('created_at', { ascending: false });

	if (search) {
		query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
	}
	if (role && role !== 'all') query = query.eq('role', role);
	if (banned === 'true') query = query.not('banned_at', 'is', null);
	if (banned === 'false') query = query.is('banned_at', null);

	const { data, error } = await query;
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	return NextResponse.json({ users: data });
}
