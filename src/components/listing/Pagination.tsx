'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type PaginationProps = {
	page: number;
	totalPages: number;
};

export function Pagination({ page, totalPages }: PaginationProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	if (totalPages <= 1) return null;

	const goTo = (p: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', String(p));
		router.push(`/anuncios?${params.toString()}`);
	};

	const pages: (number | '...')[] = [];
	if (totalPages <= 7) {
		for (let i = 1; i <= totalPages; i++) pages.push(i);
	} else {
		pages.push(1);
		if (page > 3) pages.push('...');
		const start = Math.max(2, page - 1);
		const end = Math.min(totalPages - 1, page + 1);
		for (let i = start; i <= end; i++) pages.push(i);
		if (page < totalPages - 2) pages.push('...');
		pages.push(totalPages);
	}

	return (
		<nav className="flex items-center justify-center gap-1 pt-6" aria-label="Paginação">
			<button
				type="button"
				onClick={() => goTo(page - 1)}
				disabled={page <= 1}
				className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
				aria-label="Página anterior"
			>
				<ChevronLeft className="h-4 w-4" />
			</button>

			{pages.map((p, i) =>
				p === '...' ? (
					<span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">
						…
					</span>
				) : (
					<button
						key={p}
						type="button"
						onClick={() => goTo(p)}
						className={cn(
							'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors',
							p === page
								? 'bg-primary text-primary-foreground'
								: 'border border-border hover:border-primary hover:text-primary',
						)}
						aria-current={p === page ? 'page' : undefined}
					>
						{p}
					</button>
				),
			)}

			<button
				type="button"
				onClick={() => goTo(page + 1)}
				disabled={page >= totalPages}
				className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
				aria-label="Próxima página"
			>
				<ChevronRight className="h-4 w-4" />
			</button>
		</nav>
	);
}
