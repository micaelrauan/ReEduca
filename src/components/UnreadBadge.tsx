'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRealtimeUnread } from '@/hooks/useRealtimeUnread';

export function UnreadBadge() {
	const { isSignedIn, isLoaded, user } = useUser();
	const { count, setCount } = useRealtimeUnread({
		userId: user?.id ?? '',
	});

	useEffect(() => {
		if (!isLoaded || !isSignedIn || !user) return;

		let cancelled = false;
		const load = async () => {
			try {
				const res = await fetch('/api/messages/unread-count');
				if (res.ok) {
					const data = await res.json();
					if (!cancelled) setCount(data.count ?? 0);
				}
			} catch {}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, [isLoaded, isSignedIn, user, setCount]);

	if (!isSignedIn || count === 0) return null;

	return (
		<span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
			{count > 99 ? '99+' : count}
		</span>
	);
}
