import { Suspense } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { ListingFilters } from '@/components/ListingFilters';
import { ListingsGrid } from '@/components/listing/ListingsGrid';
import { Pagination } from '@/components/listing/Pagination';
import { Dukinha } from '@/components/Dukinha';
import { searchListings } from '@/lib/listings-query';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Anúncios de materiais escolares',
	description:
		'Busque livros, apostilas, cadernos, mochilas e calculadoras para venda, troca ou doação perto de você no ReEduca.',
};

type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AnunciosPage({ searchParams }: PageProps) {
	const sp = await searchParams;

	let result: Awaited<ReturnType<typeof searchListings>> = {
		items: [],
		total: 0,
		page: 1,
		pageSize: 24,
		totalPages: 0,
	};
	let error = '';
	try {
		result = await searchListings(sp);
	} catch (err) {
		console.error('anuncios', err);
		error = 'Não conseguimos carregar os anúncios agora.';
	}

	const { items, total, page, totalPages } = result;

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-6">
			<h1 className="font-display text-2xl font-extrabold">Anúncios</h1>
			<p className="text-sm text-muted-foreground">
				{total} material{total !== 1 ? 'is' : ''} disponível{total !== 1 ? 'is' : ''}
			</p>

			<div className="sticky top-[68px] z-30 -mx-4 mt-4 bg-background/95 px-4 py-3 backdrop-blur">
				<SearchBar initialQuery={typeof sp.q === 'string' ? sp.q : ''} />
			</div>

			<div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
				<aside>
					<ListingFilters />
				</aside>

				<div>
					{error && (
						<p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
							{error}
						</p>
					)}
					{!error && items.length === 0 ? (
						<div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
							<Dukinha className="h-24 w-24" />
							<p className="font-display text-lg font-bold">
								O Dukinha procurou e não achou nada
							</p>
							<p className="text-sm text-muted-foreground">
								Tente mudar os filtros ou buscar por outra palavra.
							</p>
						</div>
					) : (
						!error && (
							<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
								<ListingsGrid listings={items} />
							</div>
						)
					)}

					<Suspense>
						<Pagination page={page} totalPages={totalPages} />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
