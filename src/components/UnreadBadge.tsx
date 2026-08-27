'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function UnreadBadge() {
	const { isSignedIn, isLoaded } = useUser();
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!isLoaded || !isSignedIn) return;

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
		const interval = setInterval(load, 15000);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [isLoaded, isSignedIn]);

	if (!isSignedIn || count === 0) return null;

	return (
		<span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
			{count > 99 ? '99+' : count}
		</span>
	);
}
