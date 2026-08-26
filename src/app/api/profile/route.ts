import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';
import { jsonError, parseBody } from '@/lib/api';
import { profileUpdateSchema } from '@/lib/validators';
import type { Database } from '@/lib/supabase-types';

export async function PATCH(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return jsonError('Faça login.', 401);

	const parsed = await parseBody(req, profileUpdateSchema);
	if (parsed.error) return parsed.error;
	const data = parsed.data;

	const updateData: Database['public']['Tables']['users']['Update'] = {};
	if (data.name !== undefined) updateData.name = data.name || null;
	if (data.region !== undefined) updateData.region = data.region || null;
	if (data.bio !== undefined) updateData.bio = data.bio || null;

	try {
		const { data: updated, error } = await supabase
			.from('users')
			.update(updateData)
			.eq('id', userId)
			.select('id, name, region, bio')
			.single();

		if (error) throw error;
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
