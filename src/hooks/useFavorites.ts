'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import type { SerializedListing } from '@/lib/reeduca';

export default function useFavorites() {
	const { isSignedIn, isLoaded, user } = useUser();
	const [favorites, setFavorites] = useState<SerializedListing[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		if (!isLoaded) return;
		if (!isSignedIn) {
			setFavorites([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const res = await fetch('/api/favorites');
			if (res.ok) setFavorites((await res.json()) as SerializedListing[]);
		} catch (err) {
			console.error('favoritos', err);
		} finally {
			setLoading(false);
		}
	}, [isLoaded, isSignedIn]);

	useEffect(() => {
		load();
	}, [load]);

	const isFavorite = useCallback(
		(listingId: string) => favorites.some((f) => f.id === listingId),
		[favorites],
	);

	const toggleFavorite = useCallback(
		async (listing: SerializedListing): Promise<boolean> => {
			if (!isSignedIn || !user) return false;
			if (favorites.some((f) => f.id === listing.id)) {
				setFavorites((prev) => prev.filter((f) => f.id !== listing.id));
				await fetch(`/api/favorites?listingId=${encodeURIComponent(listing.id)}`, {
					method: 'DELETE',
				});
			} else {
				setFavorites((prev) => [listing, ...prev]);
				await fetch('/api/favorites', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ listingId: listing.id }),
				});
			}
			return true;
		},
		[favorites, isSignedIn, user],
	);

	return { favorites, loading, isFavorite, toggleFavorite, reload: load };
}
