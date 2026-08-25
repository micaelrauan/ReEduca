import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';
import { StarRating } from '@/components/StarRating';
import { cn } from '@/lib/utils';
import {
	CONDITIONS,
	DEALS,
	type SerializedListing,
	dealStyle,
	labelOf,
	listingPhotos,
	priceLabel,
	sellerName,
	sellerRating,
} from '@/lib/reeduca';

type ListingCardProps = {
	listing: SerializedListing;
	favorite?: boolean;
	onToggleFavorite?: (listing: SerializedListing) => void;
};

export function ListingCard({ listing, favorite = false, onToggleFavorite }: ListingCardProps) {
	const photo = listingPhotos(listing)[0];

	return (
		<article className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_-24px_hsl(165_40%_20%/0.9)] transition-transform duration-200 hover:-translate-y-1">
			<Link href={`/anuncio/${listing.id}`} className="block">
				<div className="relative aspect-[4/3] overflow-hidden bg-muted">
					{photo ? (
						<img
							src={photo}
							alt={listing.title}
							loading="lazy"
							className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
							Sem foto
						</div>
					)}
					<span
						className={cn(
							'absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
							dealStyle(listing.deal),
						)}
					>
						{labelOf(DEALS, listing.deal)}
					</span>
					{listing.status !== 'ativo' && (
						<span className="absolute right-3 top-3 rounded-full bg-foreground/85 px-3 py-1 text-xs font-semibold text-background">
							{listing.status === 'reservado' ? 'Reservado' : 'Concluído'}
						</span>
					)}
				</div>
				<div className="space-y-2 p-4">
					<h3 className="font-display line-clamp-2 text-base font-bold leading-snug">
						{listing.title}
					</h3>
					<p className="font-display text-lg font-extrabold text-primary">{priceLabel(listing)}</p>
					<div className="flex items-center gap-1 text-xs text-muted-foreground">
						<MapPin className="h-3.5 w-3.5" />
						<span className="truncate">{listing.region || 'Região não informada'}</span>
					</div>
					<div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
						<span className="truncate">{sellerName(listing)}</span>
						<div className="flex shrink-0 items-center gap-1">
							<StarRating value={sellerRating(listing)} size="h-3 w-3" />
						</div>
					</div>
					<p className="text-xs text-muted-foreground">{labelOf(CONDITIONS, listing.condition)}</p>
				</div>
			</Link>
			{onToggleFavorite && (
				<button
					type="button"
					aria-label={favorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
					onClick={() => onToggleFavorite(listing)}
					className="absolute bottom-4 right-3 rounded-full border border-border bg-background/90 p-2 transition-transform active:scale-90"
				>
					<Heart
						className={cn(
							'h-4 w-4',
							favorite ? 'fill-destructive text-destructive' : 'text-muted-foreground',
						)}
					/>
				</button>
			)}
		</article>
	);
}
