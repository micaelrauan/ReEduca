'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Flag, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import useFavorites from '@/hooks/useFavorites';
import type { SerializedListing } from '@/lib/reeduca';
import { cn } from '@/lib/utils';

type ListingActionsProps = {
	listing: SerializedListing;
	isOwner: boolean;
};

export function ListingActions({ listing, isOwner }: ListingActionsProps) {
	const router = useRouter();
	const { isSignedIn } = useUser();
	const { isFavorite, toggleFavorite } = useFavorites();
	const [notice, setNotice] = useState('');
	const [reportOpen, setReportOpen] = useState(false);
	const [reason, setReason] = useState('');
	const [sendingReport, setSendingReport] = useState(false);

	const contact = () => {
		if (!isSignedIn) {
			router.push('/sign-in');
			return;
		}
		if (isOwner) {
			setNotice('Este anúncio é seu.');
			return;
		}
		router.push(`/chat/${listing.id}/${listing.ownerId}`);
	};

	const sendReport = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isSignedIn) {
			router.push('/sign-in');
			return;
		}
		setSendingReport(true);
		try {
			const res = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason, kind: 'anuncio', listingId: listing.id }),
			});
			if (res.ok) {
				setReportOpen(false);
				setReason('');
				setNotice('Denúncia enviada. Nossa equipe vai analisar.');
			} else {
				setNotice('Não foi possível enviar a denúncia.');
			}
		} finally {
			setSendingReport(false);
		}
	};

	return (
		<>
			{notice && (
				<p className="rounded-xl bg-secondary/30 p-3 text-sm text-secondary-foreground">{notice}</p>
			)}

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={contact}
					className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground transition-transform active:scale-[0.98]"
				>
					<MessageCircle className="h-4 w-4" /> Falar com o anunciante
				</button>
				<button
					type="button"
					onClick={() =>
						isSignedIn ? toggleFavorite(listing) : router.push('/sign-in')
					}
					aria-label="Favoritar"
					className="flex min-h-[48px] w-12 items-center justify-center rounded-full border border-border"
				>
					<Heart
						className={cn(
							'h-5 w-5',
							isFavorite(listing.id)
								? 'fill-destructive text-destructive'
								: 'text-muted-foreground',
						)}
					/>
				</button>
				<button
					type="button"
					aria-label="Compartilhar"
					onClick={() => {
						navigator.clipboard?.writeText(window.location.href);
						setNotice('Link copiado!');
					}}
					className="flex min-h-[48px] w-12 items-center justify-center rounded-full border border-border"
				>
					<Share2 className="h-5 w-5 text-muted-foreground" />
				</button>
			</div>

			<button
				type="button"
				onClick={() => setReportOpen((v) => !v)}
				className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
			>
				<Flag className="h-3.5 w-3.5" /> Denunciar anúncio
			</button>

			{reportOpen && (
				<form onSubmit={sendReport} className="space-y-2 rounded-2xl border border-border p-4">
					<label className="text-xs font-semibold text-muted-foreground" htmlFor="reason">
						Conte o que está errado
					</label>
					<textarea
						id="reason"
						required
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						rows={3}
						className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
					/>
					<button
						type="submit"
						disabled={sendingReport}
						className="min-h-[44px] rounded-full bg-destructive px-4 text-sm font-bold text-destructive-foreground disabled:opacity-60"
					>
						{sendingReport ? 'Enviando...' : 'Enviar denúncia'}
					</button>
				</form>
			)}
		</>
	);
}
