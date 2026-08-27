import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Dukinha } from '@/components/Dukinha';
import {
	priceLabel,
	listingPhotos,
	type SerializedListing,
	type ListingWithOwnerName,
	serializeListing,
} from '@/lib/reeduca';

type Props = { listing: SerializedListing };

async function getSimilar(listing: SerializedListing): Promise<SerializedListing[]> {
	const { data } = await supabase
		.from('listings')
		.select('*, owner:users!owner_id(name)')
		.eq('category', listing.category)
		.neq('id', listing.id)
		.eq('status', 'ativo')
		.is('deleted_at', null)
		.order('created_at', { ascending: false })
		.limit(4);

	return (data as ListingWithOwnerName[] | null)?.map(serializeListing) ?? [];
}

export async function SimilarListings({ listing }: Props) {
	const similar = await getSimilar(listing);
	if (!similar.length) return null;

	return (
		<section className="mt-8 border-t border-border pt-6">
			<h2 className="font-display text-lg font-bold">Anúncios semelhantes</h2>
			<div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
				{similar.map((s) => {
					const photos = listingPhotos(s);
					return (
						<Link
							key={s.id}
							href={`/anuncio/${s.id}`}
							className="group rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/30"
						>
							<div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted">
								{photos.length > 0 ? (
									<img
										src={photos[0]}
										alt={s.title}
										className="h-full w-full object-cover transition-transform group-hover:scale-105"
									/>
								) : (
									<Dukinha className="h-10 w-10 text-muted-foreground/40" />
								)}
							</div>
							<p className="mt-2 line-clamp-2 text-sm font-bold leading-snug">{s.title}</p>
							<p className="mt-0.5 text-xs font-semibold text-primary">{priceLabel(s)}</p>
							<div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
								<MapPin className="h-3 w-3" /> {s.region || '—'}
							</div>
						</Link>
					);
				})}
			</div>
		</section>
	);
}
