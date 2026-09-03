import { supabase } from './supabase';

const BUCKET = 'listing-photos';

export async function deleteListingPhotos(listingId: string): Promise<void> {
	const { data: files } = await supabase.storage.from(BUCKET).list(`listings/${listingId}`);
	if (!files || files.length === 0) return;
	const paths = files.map((f) => `listings/${listingId}/${f.name}`);
	await supabase.storage.from(BUCKET).remove(paths);
}

export async function deleteListingPhotoByPath(path: string): Promise<void> {
	await supabase.storage.from(BUCKET).remove([path]);
}
