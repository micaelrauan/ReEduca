import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError } from '@/lib/api';
import { z } from 'zod';

const reportSchema = z.object({
	reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres.'),
});

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para denunciar.', 401);

	const { id: targetId } = await params;
	if (targetId === userId) return jsonError('Não é possível denunciar a si mesmo.', 422);

	const body = await req.json();
	const parsed = reportSchema.safeParse(body);
	if (!parsed.success) return jsonError(parsed.error.errors[0].message, 422);

	const { error } = await supabase.from('reports').insert({
		reason: parsed.data.reason,
		kind: 'user',
		reporter_id: userId,
		listing_id: null,
	});

	if (error) throw error;

	return NextResponse.json({ ok: true }, { status: 201 });
}
