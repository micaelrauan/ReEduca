'use client';

import Link from 'next/link';
import { Dukinha } from '@/components/Dukinha';
import { ListingCard } from '@/components/ListingCard';
import useFavorites from '@/hooks/useFavorites';

export default function FavoritesPage() {
	const { favorites, loading, toggleFavorite } = useFavorites();

	return (
		<div className="mx-auto w-full max-w-5xl px-4 py-6">
			<h1 className="font-display text-2xl font-extrabold">Favoritos</h1>
			<p className="text-sm text-muted-foreground">
				O que você salvou para negociar com calma.
			</p>

			{loading ? (
				<div className="mt-5 h-64 animate-pulse rounded-2xl bg-muted" />
			) : favorites.length === 0 ? (
				<div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
					<Dukinha className="h-24 w-24" />
					<p className="font-display text-lg font-bold">Nada salvo ainda</p>
					<p className="text-sm text-muted-foreground">
						Toque no coração dos anúncios que te interessarem.
					</p>
					<Link
						href="/anuncios"
						className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
					>
						Explorar anúncios
					</Link>
				</div>
			) : (
				<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{favorites.map((l) => (
						<ListingCard
							key={l.id}
							listing={l}
							favorite
							onToggleFavorite={toggleFavorite}
						/>
					))}
				</div>
			)}
		</div>
	);
}
