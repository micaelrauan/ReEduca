import { supabase } from './supabase';

const BUCKET = 'listing-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validatePhotoFile(file: File): string | null {
	if (!ALLOWED_TYPES.includes(file.type)) {
		return 'Apenas JPG, PNG ou WebP são aceitos.';
	}
	if (file.size > MAX_FILE_SIZE) {
		return 'Cada foto pode ter no máximo 5MB.';
	}
	return null;
}

export async function uploadListingPhoto(
	listingId: string,
	file: File,
	index: number,
): Promise<string> {
	const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
	const path = `listings/${listingId}/${index}.${ext}`;

	const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
		contentType: file.type,
		upsert: true,
	});

	if (error) throw error;

	const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
	return data.publicUrl;
}

export async function deleteListingPhotos(listingId: string): Promise<void> {
	const { data: files } = await supabase.storage.from(BUCKET).list(`listings/${listingId}`);

	if (!files || files.length === 0) return;

	const paths = files.map((f) => `listings/${listingId}/${f.name}`);
	await supabase.storage.from(BUCKET).remove(paths);
}

export async function deleteListingPhotoByPath(path: string): Promise<void> {
	await supabase.storage.from(BUCKET).remove([path]);
}
