'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

type SearchBarProps = {
	initialQuery?: string;
};

export function SearchBar({ initialQuery = '' }: SearchBarProps) {
	const router = useRouter();
	const [query, setQuery] = useState(initialQuery);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				router.push(`/anuncios?q=${encodeURIComponent(query.trim())}`);
			}}
			className="flex gap-2"
		>
			<div className="relative flex-1">
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar material"
					className="w-full rounded-full border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
			<button
				type="submit"
				className="min-h-[44px] rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
			>
				Buscar
			</button>
		</form>
	);
}
