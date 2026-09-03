import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureMirroredUser } from '@/lib/server-user';

const BUCKET = 'listing-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request) {
	const userId = await ensureMirroredUser();
	if (!userId) return NextResponse.json({ error: 'Faça login.' }, { status: 401 });

	const formData = await req.formData();
	const file = formData.get('file') as File | null;
	const listingId = formData.get('listingId') as string | null;
	const index = formData.get('index') as string | null;

	if (!file || !listingId || index === null) {
		return NextResponse.json({ error: 'Parâmetros obrigatórios: file, listingId, index.' }, { status: 400 });
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return NextResponse.json({ error: 'Apenas JPG, PNG ou WebP são aceitos.' }, { status: 400 });
	}
	if (file.size > MAX_FILE_SIZE) {
		return NextResponse.json({ error: 'Cada foto pode ter no máximo 5MB.' }, { status: 400 });
	}

	const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
	const path = `listings/${listingId}/${index}.${ext}`;

	const buffer = Buffer.from(await file.arrayBuffer());

	const { error } = await supabase.storage
		.from(BUCKET)
		.upload(path, buffer, { contentType: file.type, upsert: true });

	if (error) {
		console.error('Upload error:', error.message, error);
		const msg = error.message?.includes('Bucket not found')
			? 'Bucket "listing-photos" não existe no Supabase Storage. Crie o bucket no Dashboard.'
			: `Erro ao enviar: ${error.message}`;
		return NextResponse.json({ error: msg }, { status: 500 });
	}

	const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
	return NextResponse.json({ url: data.publicUrl });
}
