import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { StarRating } from '@/components/StarRating';
import { Gallery } from '@/components/listing/Gallery';
import { ListingActions } from '@/components/listing/ListingActions';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
	CONDITIONS,
	DEALS,
	type SerializedListing,
	type ListingWithOwnerName,
	dealStyle,
	labelOf,
	listingPhotos,
	priceLabel,
	sellerName,
	serializeListing,
} from '@/lib/reeduca';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

async function getListing(id: string): Promise<ListingWithOwnerName | null> {
	const { data } = await supabase
		.from('listings')
		.select('*, owner:users!owner_id(name)')
		.eq('id', id)
		.single();
	return data as ListingWithOwnerName | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { id } = await params;
	try {
		const listing = await getListing(id);
		if (!listing) return { title: 'Anúncio não encontrado' };
		return {
			title: listing.title,
			description: (listing.description || listing.title).slice(0, 150),
		};
	} catch {
		return { title: 'Anúncio' };
	}
}

export default async function ListingDetailPage({ params }: PageProps) {
	const { id } = await params;
	let listing: SerializedListing | null = null;
	let ratingsCount = 0;
	let avg = 0;
	try {
		const rec = await getListing(id);
		if (!rec) notFound();
		listing = serializeListing(rec);
		const { data: ratings } = await supabase
			.from('ratings')
			.select('stars')
			.eq('target_id', rec.owner_id);
		ratingsCount = ratings?.length ?? 0;
		avg = ratingsCount
			? ratings!.reduce((s, r) => s + r.stars, 0) / ratingsCount
			: (listing.sellerRating ?? 0);
	} catch (err) {
		console.error('detail', err);
		notFound();
	}

	const { userId } = await auth();
	const isOwner = userId === listing.ownerId;
	const photos = listingPhotos(listing);

	return (
		<div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 md:grid-cols-[1.1fr_0.9fr]">
			<Gallery photos={photos} title={listing.title} />

			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<span
						className={cn(
							'rounded-full px-3 py-1 text-xs font-bold uppercase',
							dealStyle(listing.deal),
						)}
					>
						{labelOf(DEALS, listing.deal)}
					</span>
					<span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
						{labelOf(CONDITIONS, listing.condition)}
					</span>
					{listing.status !== 'ativo' && (
						<span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
							{listing.status === 'reservado' ? 'Reservado' : 'Concluído'}
						</span>
					)}
				</div>

				<h1 className="font-display text-2xl font-extrabold leading-tight">{listing.title}</h1>
				<p className="font-display text-2xl font-extrabold text-primary">{priceLabel(listing)}</p>

				<div className="flex items-center gap-1 text-sm text-muted-foreground">
					<MapPin className="h-4 w-4" /> {listing.region || 'Região não informada'}
				</div>

				<p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
					{listing.description || 'Sem descrição.'}
				</p>

				<div className="rounded-2xl border border-border bg-card p-4">
					<p className="text-xs font-semibold uppercase text-muted-foreground">Anunciante</p>
					<p className="font-display text-base font-bold">{sellerName(listing)}</p>
					<div className="mt-1 flex items-center gap-2">
						<StarRating value={avg} />
						<span className="text-xs text-muted-foreground">
							{avg ? avg.toFixed(1) : 'Sem avaliações'}
							{ratingsCount ? ` (${ratingsCount})` : ''}
						</span>
					</div>
				</div>

				{isOwner && (
					<Link
						href={`/anuncio/${listing.id}/editar`}
						className="inline-flex min-h-[44px] items-center rounded-full border border-border px-5 text-sm font-semibold"
					>
						Editar este anúncio
					</Link>
				)}

				<ListingActions listing={listing} isOwner={isOwner} />

				<p className="text-xs text-muted-foreground">
					Demonstrações sem dono real não têm chat ativo —{' '}
					<Link href="/anuncios" className="font-semibold text-primary">
						veja outros anúncios
					</Link>
					.
				</p>
			</div>
		</div>
	);
}
