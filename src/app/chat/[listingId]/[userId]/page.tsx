'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { StarRating } from '@/components/StarRating';
import { cn } from '@/lib/utils';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';

type ListingInfo = {
	id: string;
	title: string;
	deal: string;
	price: number | null;
	wanted: string | null;
};

function priceLabelOf(listing: ListingInfo): string {
	if (listing.deal === 'doacao') return 'Doação';
	if (listing.deal === 'troca') return listing.wanted ? `Troca por ${listing.wanted}` : 'Troca';
	if (!listing.price) return 'A combinar';
	return listing.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ChatThreadPage() {
	const params = useParams<{ listingId: string; userId: string }>();
	const listingId = params?.listingId ?? '';
	const otherUserId = params?.userId ?? '';
	const { user } = useUser();
	const myId = user?.id;

	const [listing, setListing] = useState<ListingInfo | null>(null);
	const [text, setText] = useState('');
	const [stars, setStars] = useState(0);
	const [ratingComment, setRatingComment] = useState('');
	const [ratingSent, setRatingSent] = useState(false);
	const [error, setError] = useState('');
	const [online, setOnline] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);

	const { messages, setMessages } = useRealtimeChat({
		listingId,
		otherUserId,
		myId: myId || '',
	});

	const load = useCallback(async () => {
		if (!myId || !listingId || !otherUserId) return;
		try {
			const res = await fetch(
				`/api/messages?listingId=${encodeURIComponent(listingId)}&userId=${encodeURIComponent(otherUserId)}`,
			);
			if (res.ok) {
				setMessages((await res.json()) as typeof messages);
				setError('');
			}
		} catch {
			setError('Não conseguimos carregar essa conversa.');
		}
	}, [listingId, otherUserId, myId, setMessages]);

	useEffect(() => {
		load();
	}, [load]);

	useEffect(() => {
		fetch(`/api/listings/${listingId}`)
			.then((res) => (res.ok ? res.json() : null))
			.then((data: ListingInfo | null) => setListing(data))
			.catch(() => {});
	}, [listingId]);

	useEffect(() => {
		if (!myId || !listingId || !otherUserId) return;
		fetch('/api/messages/read', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ listingId, otherUserId }),
		}).catch(() => {});
	}, [myId, listingId, otherUserId, messages.length]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ block: 'end' });
	}, [messages]);

	useEffect(() => {
		if (!myId) return;
		const interval = setInterval(() => {
			fetch('/api/messages/heartbeat', { method: 'POST' }).catch(() => {});
		}, 30000);
		return () => clearInterval(interval);
	}, [myId]);

	useEffect(() => {
		if (!otherUserId) return;
		let cancelled = false;
		const check = async () => {
			try {
				const res = await fetch(`/api/users/online?userId=${encodeURIComponent(otherUserId)}`);
				if (res.ok) {
					const data = await res.json();
					if (!cancelled) setOnline(data.online);
				}
			} catch {}
		};
		check();
		const interval = setInterval(check, 30000);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [otherUserId]);

	const send = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!text.trim() || !listingId || !otherUserId) return;
		const body = text.trim();
		setText('');
		try {
			const res = await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recipientId: otherUserId, listingId, text: body }),
			});
			if (!res.ok) throw new Error('falha');
			const created = (await res.json()) as (typeof messages)[number];
			setMessages((prev) =>
				prev.some((m) => m.id === created.id) ? prev : [...prev, created],
			);
		} catch {
			setError('Mensagem não enviada. Tente de novo.');
		}
	};

	const rate = async () => {
		if (!stars || !listingId || !otherUserId) return;
		const res = await fetch('/api/ratings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				targetId: otherUserId,
				listingId,
				stars,
				comment: ratingComment.trim(),
			}),
		});
		if (res.ok) setRatingSent(true);
	};

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-4">
			{listing && (
				<Link
					href={`/anuncio/${listing.id}`}
					className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3"
				>
					<span className="truncate font-display font-bold">{listing.title}</span>
					<span className="shrink-0 text-sm font-bold text-primary">{priceLabelOf(listing)}</span>
				</Link>
			)}

			{error && (
				<p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</p>
			)}

			<div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
				<span
					className={cn(
						'h-2 w-2 rounded-full',
						online ? 'bg-green-500' : 'bg-muted-foreground/40',
					)}
				/>
				{online ? 'Online agora' : 'Offline'}
			</div>

			<div className="mt-4 min-h-[45vh] space-y-2">
				{messages.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						Comece dizendo oi e combine os detalhes da negociação.
					</p>
				) : (
					messages.map((m) => (
						<div
							key={m.id}
							className={cn(
								'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
								m.sender_id === myId
									? 'ml-auto bg-primary text-primary-foreground'
									: 'bg-muted text-foreground',
							)}
						>
							<p>{m.text}</p>
							{m.sender_id === myId && (
								<p className={cn(
									'mt-0.5 text-[10px]',
									m.read_at ? 'text-primary-foreground/70' : 'text-primary-foreground/40',
								)}>
									{m.read_at ? 'Lida' : 'Enviada'}
								</p>
							)}
						</div>
					))
				)}
				<div ref={bottomRef} />
			</div>

			<form onSubmit={send} className="sticky bottom-20 mt-4 flex gap-2 md:bottom-4">
				<input
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Escreva sua mensagem"
					className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
				/>
				<button
					type="submit"
					aria-label="Enviar"
					className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95"
				>
					<Send className="h-5 w-5" />
				</button>
			</form>

			<div className="mt-6 rounded-2xl border border-border bg-card p-4">
				<p className="font-display font-bold">Negociação concluída?</p>
				<p className="text-sm text-muted-foreground">
					Avalie o outro estudante de 1 a 5 estrelas.
				</p>
				{ratingSent ? (
					<p className="mt-2 text-sm font-semibold text-primary">Obrigado pela avaliação!</p>
				) : (
					<div className="mt-3 space-y-3">
						<StarRating value={stars} onChange={setStars} size="h-6 w-6" />
						<textarea
							value={ratingComment}
							onChange={(e) => setRatingComment(e.target.value)}
							placeholder="Deixe um comentário (opcional)"
							rows={2}
							className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
						/>
						<button
							type="button"
							onClick={rate}
							disabled={!stars}
							className="min-h-[40px] rounded-full bg-foreground px-4 text-sm font-bold text-background disabled:opacity-50"
						>
							Enviar avaliação
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
