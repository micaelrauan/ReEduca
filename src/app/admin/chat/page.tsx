'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search } from 'lucide-react';

interface Conversation {
	listing_id: string | null;
	user1: string;
	user2: string;
	user1_name: string;
	user2_name: string;
	listing_title: string;
	last_message: string;
	last_message_at: string;
	unread_count: number;
}

export default function AdminChatPage() {
	const router = useRouter();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');

	useEffect(() => {
		fetch('/api/admin/chat/threads')
			.then((r) => r.json())
			.then((data) => {
				setConversations(data.conversations || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	const filtered = conversations.filter((c) => {
		if (!search) return true;
		const q = search.toLowerCase();
		return (
			c.user1_name.toLowerCase().includes(q) ||
			c.user2_name.toLowerCase().includes(q) ||
			c.listing_title.toLowerCase().includes(q)
		);
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<MessageSquare className="h-6 w-6 text-primary" />
				<h1 className="font-display text-2xl font-bold">Chat</h1>
			</div>

			<div className="relative sm:max-w-xs">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Buscar por usuário ou anúncio..."
					className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
				/>
			</div>

			{loading ? (
				<p className="text-muted-foreground">Carregando...</p>
			) : filtered.length === 0 ? (
				<div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
					Nenhuma conversa encontrada.
				</div>
			) : (
				<div className="space-y-2">
					{filtered.map((conv, i) => (
						<button
							key={`${conv.listing_id}-${conv.user1}-${conv.user2}-${i}`}
							type="button"
							onClick={() => router.push(`/admin/chat/${conv.listing_id}/${conv.user1}`)}
							className="w-full rounded-xl border border-border bg-card p-4 text-left hover:bg-muted/50 transition-colors"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2 mb-1">
										<span className="font-medium">{conv.user1_name}</span>
										<span className="text-muted-foreground">↔</span>
										<span className="font-medium">{conv.user2_name}</span>
									</div>
									<p className="text-sm text-muted-foreground truncate">
										{conv.listing_title}
									</p>
									<p className="text-sm text-muted-foreground truncate mt-1">
										{conv.last_message}
									</p>
								</div>
								<div className="flex flex-col items-end gap-1 shrink-0">
									<span className="text-xs text-muted-foreground">
										{new Date(conv.last_message_at).toLocaleDateString('pt-BR')}
									</span>
									{conv.unread_count > 0 && (
										<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
											{conv.unread_count}
										</span>
									)}
								</div>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
