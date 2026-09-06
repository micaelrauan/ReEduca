'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface Message {
	id: string;
	text: string;
	sender_id: string;
	recipient_id: string;
	sender_name: string;
	recipient_name: string;
	created_at: string;
	read_at: string | null;
}

export default function AdminChatDetailPage() {
	const params = useParams();
	const router = useRouter();
	const listingId = params.listingId as string;
	const userId = params.userId as string;

	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`/api/admin/chat/${listingId}/${userId}`)
			.then((r) => r.json())
			.then((data) => {
				setMessages(data.messages || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [listingId, userId]);

	const getSenderColor = (senderId: string) => {
		if (senderId === userId) return 'bg-primary text-primary-foreground';
		return 'bg-muted text-foreground';
	};

	if (loading) return <p className="text-muted-foreground">Carregando...</p>;

	return (
		<div className="space-y-6">
			<button
				type="button"
				onClick={() => router.back()}
				className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				Voltar
			</button>

			<div>
				<h1 className="font-display text-2xl font-bold">Conversa</h1>
				<p className="text-sm text-muted-foreground">
					Anúncio: {listingId} • Usuário: {userId}
				</p>
			</div>

			<div className="rounded-xl border border-border bg-card p-4">
				<p className="text-sm text-muted-foreground mb-4">
					Modo somente leitura — o admin não pode enviar mensagens.
				</p>

				{messages.length === 0 ? (
					<p className="text-muted-foreground text-center py-8">Nenhuma mensagem encontrada.</p>
				) : (
					<div className="space-y-3">
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
							>
								<div className={`max-w-[70%] rounded-xl px-4 py-2 ${getSenderColor(msg.sender_id)}`}>
									<p className="text-xs font-medium mb-1 opacity-70">
										{msg.sender_name}
									</p>
									<p className="text-sm whitespace-pre-wrap">{msg.text}</p>
									<p className="text-[10px] mt-1 opacity-50">
										{new Date(msg.created_at).toLocaleString('pt-BR')}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
