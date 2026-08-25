'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Home, MessageCircle, PlusCircle, Search, User } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Dukinha } from '@/components/Dukinha';
import { cn } from '@/lib/utils';

const navItems = [
	{ to: '/', label: 'Início', icon: Home, exact: true },
	{ to: '/anuncios', label: 'Buscar', icon: Search },
	{ to: '/novo', label: 'Anunciar', icon: PlusCircle },
	{ to: '/favoritos', label: 'Favoritos', icon: Heart },
	{ to: '/chat', label: 'Chat', icon: MessageCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const isActive = (to: string, exact?: boolean) =>
		exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

	return (
		<div className="flex min-h-[100dvh] flex-col bg-background">
			<header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
				<div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
					<Link href="/" className="flex items-center gap-2">
						<Dukinha className="h-9 w-9" />
						<span className="font-display text-xl font-extrabold tracking-tight">
							Re<span className="text-primary">Educa</span>
						</span>
					</Link>
					<nav className="ml-auto hidden items-center gap-1 md:flex">
						{navItems.map((item) => (
							<Link
								key={item.to}
								href={item.to}
								className={cn(
									'rounded-full px-3 py-2 text-sm font-medium transition-colors',
									isActive(item.to, item.exact)
										? 'bg-primary/10 text-primary'
										: 'text-muted-foreground hover:text-foreground',
								)}
							>
								{item.label}
							</Link>
						))}
					</nav>
					<SignedIn>
						<span className="ml-auto md:ml-0" title="Meu perfil">
							<UserButton afterSignOutUrl="/" />
						</span>
					</SignedIn>
					<SignedOut>
						<Link
							href="/sign-in"
							className="ml-auto flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium transition-transform active:scale-[0.98] md:ml-0"
						>
							<User className="h-4 w-4" />
							<span className="hidden sm:inline">Entrar</span>
						</Link>
					</SignedOut>
				</div>
			</header>

			<main className="flex-1 pb-24 md:pb-10">{children}</main>

			<footer className="border-t border-border bg-muted/40 px-4 py-8 text-sm text-muted-foreground">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<p className="max-w-sm">
						ReEduca — o que está parado com você pode fazer a diferença para outro estudante.
					</p>
					<div className="flex flex-wrap gap-4">
						<Link href="/como-funciona" className="hover:text-foreground">
							Como funciona
						</Link>
						<Link href="/anuncios" className="hover:text-foreground">
							Anúncios
						</Link>
						<Link href="/perfil" className="hover:text-foreground">
							Perfil
						</Link>
					</div>
					<p>© {new Date().getFullYear()} ReEduca</p>
				</div>
			</footer>

			<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
				<div className="grid grid-cols-5">
					{navItems.map((item) => (
						<Link
							key={item.to}
							href={item.to}
							className={cn(
								'flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium',
								isActive(item.to, item.exact) ? 'text-primary' : 'text-muted-foreground',
							)}
						>
							<item.icon className="h-5 w-5" strokeWidth={2} />
							{item.label}
						</Link>
					))}
				</div>
			</nav>
		</div>
	);
}
