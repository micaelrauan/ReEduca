'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import type { SerializedNotification } from '@/lib/reeduca';

export function NotificationBell() {
	const [count, setCount] = useState(0);
	const [notifications, setNotifications] = useState<SerializedNotification[]>([]);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		fetchCount();
		const interval = setInterval(fetchCount, 30_000);
		return () => clearInterval(interval);
	}, []);

	async function fetchCount() {
		try {
			const res = await fetch('/api/notifications/unread-count');
			if (res.ok) {
				const data = await res.json();
				setCount(data.count);
			}
		} catch {
			// ignora
		}
	}

	async function toggleOpen() {
		setOpen(!open);
		if (!open && notifications.length === 0) {
			try {
				const res = await fetch('/api/notifications');
				if (res.ok) {
					setNotifications(await res.json());
				}
			} catch {
				// ignora
			}
		}
	}

	async function markAllRead() {
		try {
			await fetch('/api/notifications/read', { method: 'PATCH' });
			setCount(0);
			setNotifications((prev) =>
				prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
			);
		} catch {
			// ignora
		}
	}

	return (
		<div className="relative">
			<button
				type="button"
				onClick={toggleOpen}
				className="relative rounded-full p-2 transition-colors hover:bg-muted"
				aria-label={`Notificações${count > 0 ? ` (${count} não lidas)` : ''}`}
			>
				<Bell className="h-5 w-5" />
				{count > 0 && (
					<span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
						{count > 9 ? '9+' : count}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<span className="text-sm font-bold">Notificações</span>
						{count > 0 && (
							<button
								type="button"
								onClick={markAllRead}
								className="text-xs text-primary hover:underline"
							>
								Marcar todas como lidas
							</button>
						)}
					</div>
					<div className="max-h-80 overflow-y-auto">
						{notifications.length === 0 ? (
							<p className="p-4 text-center text-sm text-muted-foreground">
								Nenhuma notificação
							</p>
						) : (
							notifications.map((n) => (
								<div
									key={n.id}
									className={`border-b border-border px-4 py-3 text-sm ${
										n.readAt ? 'opacity-60' : 'bg-primary/5'
									}`}
								>
									<p>{n.message}</p>
									<span className="text-xs text-muted-foreground">
										{new Date(n.createdAt).toLocaleDateString('pt-BR')}
									</span>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
