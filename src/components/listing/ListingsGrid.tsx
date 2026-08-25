'use client';

import { Reveal } from '@/components/Reveal';
import { ListingCard } from '@/components/ListingCard';
import useFavorites from '@/hooks/useFavorites';
import type { SerializedListing } from '@/lib/reeduca';

type ListingsGridProps = {
	listings: SerializedListing[];
	withReveal?: boolean;
};

export function ListingsGrid({ listings, withReveal = false }: ListingsGridProps) {
	const { isFavorite, toggleFavorite } = useFavorites();

	return (
		<>
			{listings.map((listing, i) =>
				withReveal ? (
					<Reveal key={listing.id} delay={i * 0.05}>
						<ListingCard
							listing={listing}
							favorite={isFavorite(listing.id)}
							onToggleFavorite={toggleFavorite}
						/>
					</Reveal>
				) : (
					<ListingCard
						key={listing.id}
						listing={listing}
						favorite={isFavorite(listing.id)}
						onToggleFavorite={toggleFavorite}
					/>
				),
			)}
		</>
	);
}
