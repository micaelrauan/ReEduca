'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Dukinha } from '@/components/Dukinha';

type ThreadSummary = {
	key: string;
	listingId: string;
	listingTitle: string;
	otherId: string;
	otherName: string;
	last: string;
	unread: number;
};

export default function ChatListPage() {
	const [threads, setThreads] = useState<ThreadSummary[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		fetch('/api/messages/threads')
			.then((res) => (res.ok ? res.json() : []))
			.then((rows: ThreadSummary[]) => {
				if (!cancelled) setThreads(rows);
			})
			.catch((err) => console.error('chats', err))
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="mx-auto w-full max-w-2xl px-4 py-6">
			<h1 className="font-display text-2xl font-extrabold">Conversas</h1>

			{loading ? (
				<div className="mt-5 h-40 animate-pulse rounded-2xl bg-muted" />
			) : threads.length === 0 ? (
				<div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
					<Dukinha className="h-24 w-24" />
					<p className="font-display text-lg font-bold">Nenhuma conversa ainda</p>
					<p className="text-sm text-muted-foreground">
						Abra um anúncio e toque em &quot;Falar com o anunciante&quot;.
					</p>
				</div>
			) : (
				<ul className="mt-5 space-y-3">
					{threads.map((t) => (
						<li key={t.key}>
							<Link
								href={`/chat/${t.listingId}/${t.otherId}`}
								className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
							>
								<Dukinha className="h-10 w-10" />
								<div className="min-w-0 flex-1">
									<p className="truncate font-display font-bold">{t.listingTitle}</p>
									<p className="truncate text-sm text-muted-foreground">
										{t.otherName}: {t.last}
									</p>
								</div>
								{t.unread > 0 && (
									<span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
										{t.unread > 99 ? '99+' : t.unread}
									</span>
								)}
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
