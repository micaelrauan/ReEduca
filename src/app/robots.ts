import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://reeduca.com.br';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: ['/chat/', '/api/', '/favoritos/', '/editar/'],
			},
		],
		sitemap: `${BASE_URL}/sitemap.xml`,
	};
}
