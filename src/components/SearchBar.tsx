'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

type Suggestion = { id: string; title: string };

type SearchBarProps = {
	initialQuery?: string;
};

export function SearchBar({ initialQuery = '' }: SearchBarProps) {
	const router = useRouter();
	const [query, setQuery] = useState(initialQuery);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [loading, setLoading] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (query.length < 2) {
			setSuggestions([]);
			return;
		}

		const controller = new AbortController();
		setLoading(true);

		const timeout = setTimeout(async () => {
			try {
				const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
					signal: controller.signal,
				});
				const data = await res.json();
				setSuggestions(data.suggestions ?? []);
			} catch {
				// abort
			} finally {
				setLoading(false);
			}
		}, 300);

		return () => {
			clearTimeout(timeout);
			controller.abort();
		};
	}, [query]);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setShowSuggestions(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	function handleSubmit(q?: string) {
		const search = (q ?? query).trim();
		if (!search) return;
		setShowSuggestions(false);
		router.push(`/anuncios?q=${encodeURIComponent(search)}`);
	}

	return (
		<div ref={wrapperRef} className="relative flex gap-2">
			<div className="relative flex-1">
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setShowSuggestions(true);
					}}
					onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
					placeholder="Buscar material"
					role="combobox"
					aria-expanded={showSuggestions && suggestions.length > 0}
					aria-controls="search-suggestions"
					className="w-full rounded-full border border-border bg-card py-3 pl-10 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
				/>
				{query && (
					<button
						type="button"
						onClick={() => {
							setQuery('');
							setSuggestions([]);
						}}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
						aria-label="Limpar busca"
					>
						<X className="h-4 w-4" />
					</button>
				)}

				{showSuggestions && suggestions.length > 0 && (
					<ul
						id="search-suggestions"
						role="listbox"
						className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-card shadow-lg"
					>
						{suggestions.map((s) => (
							<li
								key={s.id}
								role="option"
								tabIndex={0}
								onMouseDown={(e) => {
									e.preventDefault();
									handleSubmit(s.title);
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleSubmit(s.title);
								}}
								className="cursor-pointer px-4 py-2.5 text-sm hover:bg-muted"
							>
								{s.title}
							</li>
						))}
						{loading && (
							<li className="px-4 py-2 text-xs text-muted-foreground">Buscando…</li>
						)}
					</ul>
				)}
			</div>
			<button
				type="submit"
				onClick={() => handleSubmit()}
				className="min-h-[44px] rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
			>
				Buscar
			</button>
		</div>
	);
}
