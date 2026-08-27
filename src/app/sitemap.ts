import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://reeduca.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const { data: listings } = await supabase
		.from('listings')
		.select('id, updated_at, created_at')
		.is('deleted_at', null)
		.eq('status', 'ativo')
		.order('created_at', { ascending: false })
		.limit(5000);

	const listingUrls = (listings ?? []).map((l) => ({
		url: `${BASE_URL}/anuncio/${l.id}`,
		lastModified: l.updated_at ? new Date(l.updated_at) : new Date(l.created_at),
		changeFrequency: 'weekly' as const,
		priority: 0.7,
	}));

	return [
		{
			url: BASE_URL,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1,
		},
		{
			url: `${BASE_URL}/anuncios`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.9,
		},
		...listingUrls,
	];
}
