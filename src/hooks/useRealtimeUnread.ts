'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type UseRealtimeUnreadOptions = {
	userId: string;
	initialCount?: number;
};

export function useRealtimeUnread({
	userId,
	initialCount = 0,
}: UseRealtimeUnreadOptions) {
	const [count, setCount] = useState(initialCount);
	const channelRef = useRef<ReturnType<
		ReturnType<typeof createClient>['channel']
	> | null>(null);

	const increment = useCallback(() => {
		setCount((prev) => prev + 1);
	}, []);

	const reset = useCallback(() => {
		setCount(0);
	}, []);

	useEffect(() => {
		if (!userId) return;

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		);

		const channel = supabase
			.channel(`unread:${userId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
					filter: `recipient_id=eq.${userId}`,
				},
				() => {
					increment();
				},
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'messages',
					filter: `recipient_id=eq.${userId}`,
				},
				(payload) => {
					const msg = payload.new as { read_at: string | null };
					if (msg.read_at) {
						setCount((prev) => Math.max(0, prev - 1));
					}
				},
			)
			.subscribe();

		channelRef.current = channel;

		return () => {
			channel.unsubscribe();
			channelRef.current = null;
		};
	}, [userId, increment]);

	return { count, setCount, reset };
}
