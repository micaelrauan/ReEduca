'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type RealtimeMessage = {
	id: string;
	text: string;
	sender_id: string;
	recipient_id: string;
	listing_id: string | null;
	read_at: string | null;
	created_at: string;
};

type UseRealtimeChatOptions = {
	listingId: string;
	otherUserId: string;
	myId: string;
	initialMessages?: RealtimeMessage[];
};

export function useRealtimeChat({
	listingId,
	otherUserId,
	myId,
	initialMessages = [],
}: UseRealtimeChatOptions) {
	const [messages, setMessages] = useState<RealtimeMessage[]>(initialMessages);
	const channelRef = useRef<ReturnType<
	 ReturnType<typeof createClient>['channel']
	> | null>(null);

	const addMessage = useCallback((msg: RealtimeMessage) => {
		setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
	}, []);

	const updateReadReceipt = useCallback((msgId: string, readAt: string) => {
		setMessages((prev) =>
			prev.map((m) => (m.id === msgId ? { ...m, read_at: readAt } : m)),
		);
	}, []);

	useEffect(() => {
		if (!listingId || !otherUserId || !myId) return;

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		);

		const channel = supabase
			.channel(`chat:${listingId}:${otherUserId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
					filter: `listing_id=eq.${listingId}`,
				},
				(payload) => {
					const msg = payload.new as RealtimeMessage;
					if (
						msg.sender_id === myId ||
						(msg.sender_id === otherUserId && msg.recipient_id === myId)
					) {
						addMessage(msg);
					}
				},
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'messages',
					filter: `listing_id=eq.${listingId}`,
				},
				(payload) => {
					const msg = payload.new as RealtimeMessage;
					if (msg.read_at) {
						updateReadReceipt(msg.id, msg.read_at);
					}
				},
			)
			.subscribe();

		channelRef.current = channel;

		return () => {
			channel.unsubscribe();
			channelRef.current = null;
		};
	}, [listingId, otherUserId, myId, addMessage, updateReadReceipt]);

	return { messages, setMessages };
}
