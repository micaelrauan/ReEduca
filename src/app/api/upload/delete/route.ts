import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return NextResponse.json({ error: 'Faça login.' }, { status: 401 });

	const { path } = await req.json();
	if (!path || typeof path !== 'string') {
		return NextResponse.json({ error: 'Parâmetro path obrigatório.' }, { status: 400 });
	}

	const { error } = await supabase.storage.from('listing-photos').remove([path]);
	if (error) {
		console.error('Delete error:', error);
		return NextResponse.json({ error: 'Erro ao remover arquivo.' }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
