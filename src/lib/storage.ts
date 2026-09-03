const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

/** Upload via API route (client-side safe). */
export async function uploadListingPhoto(
	listingId: string,
	file: File,
	index: number,
): Promise<string> {
	const fd = new FormData();
	fd.append('file', file);
	fd.append('listingId', listingId);
	fd.append('index', String(index));

	const res = await fetch('/api/upload', { method: 'POST', body: fd });
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || 'Erro ao enviar foto.');
	return json.url as string;
}

/** Delete a photo via API route (client-side safe). */
export async function deleteListingPhotoByPath(path: string): Promise<void> {
	const res = await fetch('/api/upload/delete', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ path }),
	});
	if (!res.ok) {
		const json = await res.json().catch(() => ({}));
		throw new Error(json.error || 'Erro ao remover foto.');
	}
}
