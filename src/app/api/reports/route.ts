import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError, parseBody } from '@/lib/api';
import { reportCreateSchema } from '@/lib/validators';

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login para denunciar.', 401);

	const parsed = await parseBody(req, reportCreateSchema);
	if (parsed.error) return parsed.error;
	const { reason, kind, listingId } = parsed.data;

	try {
		const created = await db.report.create({
			data: { reason, kind, reporterId: userId, listingId },
		});
		return NextResponse.json({ id: created.id }, { status: 201 });
	} catch (err) {
		console.error('POST /api/reports', err);
		return jsonError('Não foi possível enviar a denúncia.', 500);
	}
}
