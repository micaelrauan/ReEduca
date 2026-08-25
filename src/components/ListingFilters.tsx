'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, CONDITIONS, DEALS } from '@/lib/reeduca';
import { cn } from '@/lib/utils';

const selectClass =
	'w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring';

const FILTER_KEYS = ['q', 'categoria', 'tipo', 'condicao', 'regiao', 'precoMax', 'ordenar'] as const;

export function ListingFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const valueOf = (key: string) => searchParams.get(key) || '';

	const update = (key: string, value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value) params.set(key, value);
		else params.delete(key);
		router.push(`/anuncios${params.size ? `?${params}` : ''}`);
	};

	const reset = () => router.push('/anuncios');

	return (
		<div className="space-y-4 rounded-2xl border border-border bg-card p-4">
			<div className="flex items-center gap-2">
				<SlidersHorizontal className="h-4 w-4 text-primary" />
				<h2 className="font-display text-sm font-bold uppercase tracking-wide">Filtros</h2>
				<button
					type="button"
					onClick={reset}
					className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
				>
					<X className="h-3 w-3" /> Limpar
				</button>
			</div>

			<div>
				<p className="mb-2 text-xs font-semibold text-muted-foreground">Tipo de negociação</p>
				<div className="flex flex-wrap gap-2">
					{DEALS.map((d) => (
						<button
							key={d.value}
							type="button"
							onClick={() => update('tipo', valueOf('tipo') === d.value ? '' : d.value)}
							className={cn(
								'rounded-full border px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95',
								valueOf('tipo') === d.value
									? `${d.className} border-transparent`
									: 'border-border text-muted-foreground',
							)}
						>
							{d.label}
						</button>
					))}
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
				<label className="block text-xs font-semibold text-muted-foreground">
					Categoria
					<select
						className={cn(selectClass, 'mt-1 font-normal text-foreground')}
						value={valueOf('categoria')}
						onChange={(e) => update('categoria', e.target.value)}
					>
						<option value="">Todas</option>
						{CATEGORIES.map((c) => (
							<option key={c.value} value={c.value}>
								{c.label}
							</option>
						))}
					</select>
				</label>

				<label className="block text-xs font-semibold text-muted-foreground">
					Estado de conservação
					<select
						className={cn(selectClass, 'mt-1 font-normal text-foreground')}
						value={valueOf('condicao')}
						onChange={(e) => update('condicao', e.target.value)}
					>
						<option value="">Qualquer</option>
						{CONDITIONS.map((c) => (
							<option key={c.value} value={c.value}>
								{c.label}
							</option>
						))}
					</select>
				</label>

				<label className="block text-xs font-semibold text-muted-foreground">
					Região
					<input
						className={cn(selectClass, 'mt-1 font-normal text-foreground')}
						placeholder="Cidade ou bairro"
						defaultValue={valueOf('regiao')}
						onBlur={(e) => update('regiao', e.target.value.trim())}
					/>
				</label>

				<label className="block text-xs font-semibold text-muted-foreground">
					Preço máximo (R$)
					<input
						type="number"
						min="0"
						className={cn(selectClass, 'mt-1 font-normal text-foreground')}
						placeholder="Sem limite"
						defaultValue={valueOf('precoMax')}
						onBlur={(e) => update('precoMax', e.target.value)}
					/>
				</label>

				<label className="block text-xs font-semibold text-muted-foreground">
					Ordenar por
					<select
						className={cn(selectClass, 'mt-1 font-normal text-foreground')}
						value={valueOf('ordenar') || 'recentes'}
						onChange={(e) => update('ordenar', e.target.value === 'recentes' ? '' : e.target.value)}
					>
						<option value="recentes">Mais recentes</option>
						<option value="menor">Menor preço</option>
						<option value="maior">Maior preço</option>
						<option value="avaliacao">Melhor avaliação</option>
					</select>
				</label>
			</div>
		</div>
	);
}

export { FILTER_KEYS };
