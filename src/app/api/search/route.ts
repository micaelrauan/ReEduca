import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const q = searchParams.get('q')?.trim();

	if (!q || q.length < 2) {
		return NextResponse.json({ suggestions: [] });
	}

	const { data } = await supabase
		.from('listings')
		.select('id, title')
		.eq('status', 'ativo')
		.is('deleted_at', null)
		.ilike('title', `%${q}%`)
		.limit(5);

	const suggestions = (data ?? []).map((l) => ({ id: l.id, title: l.title }));

	return NextResponse.json({ suggestions });
}
