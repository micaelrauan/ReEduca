'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	BarChart3,
	AlertTriangle,
	Users,
	ListIcon,
	MessageCircle,
	Settings,
	ArrowLeft,
	Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNav = [
	{ href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
	{ href: '/admin/denuncias', label: 'Denúncias', icon: AlertTriangle },
	{ href: '/admin/usuarios', label: 'Usuários', icon: Users },
	{ href: '/admin/anuncios', label: 'Anúncios', icon: ListIcon },
	{ href: '/admin/chat', label: 'Chat', icon: MessageCircle },
	{ href: '/admin/config', label: 'Config', icon: Settings },
];

export function AdminSidebar() {
	const pathname = usePathname();
	const isActive = (href: string, exact?: boolean) =>
		exact ? pathname === href : pathname.startsWith(href);

	return (
		<aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-background lg:static">
			<div className="flex h-14 items-center gap-2 border-b border-border px-4">
				<Shield className="h-5 w-5 text-primary" />
				<span className="font-display text-lg font-bold">Admin</span>
			</div>

			<nav className="flex-1 overflow-y-auto px-3 py-4">
				<ul className="space-y-1">
					{adminNav.map((item) => (
						<li key={item.href}>
							<Link
								href={item.href}
								className={cn(
									'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
									isActive(item.href, item.exact)
										? 'bg-primary/10 text-primary'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground',
								)}
							>
								<item.icon className="h-4 w-4" />
								{item.label}
							</Link>
						</li>
					))}
				</ul>
			</nav>

			<div className="border-t border-border p-3">
				<Link
					href="/"
					className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Voltar ao site
				</Link>
			</div>
		</aside>
	);
}
