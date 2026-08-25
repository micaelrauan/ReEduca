import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError, parseBody } from '@/lib/api';
import { profileUpdateSchema } from '@/lib/validators';

export async function PATCH(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const parsed = await parseBody(req, profileUpdateSchema);
	if (parsed.error) return parsed.error;
	const data = parsed.data;

	try {
		const updated = await db.user.update({
			where: { id: userId },
			data: {
				name: data.name === undefined ? undefined : data.name || null,
				region: data.region === undefined ? undefined : data.region || null,
				bio: data.bio === undefined ? undefined : data.bio || null,
			},
		});
		return NextResponse.json({
			id: updated.id,
			name: updated.name,
			region: updated.region,
			bio: updated.bio,
		});
	} catch (err) {
		console.error('PATCH /api/profile', err);
		return jsonError('Não foi possível salvar o perfil.', 500);
	}
}
