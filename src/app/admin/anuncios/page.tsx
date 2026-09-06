'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Search, Star } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { CATEGORIES, labelOf } from '@/lib/reeduca';

interface Listing {
	id: string;
	title: string;
	category: string;
	condition: string;
	status: string;
	featured: boolean;
	price: number | null;
	created_at: string;
}

export default function AdminAnunciosPage() {
	const router = useRouter();
	const [listings, setListings] = useState<Listing[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [featuredFilter, setFeaturedFilter] = useState('all');

	useEffect(() => {
		const params = new URLSearchParams();
		if (search) params.set('search', search);
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (categoryFilter !== 'all') params.set('category', categoryFilter);
		if (featuredFilter !== 'all') params.set('featured', featuredFilter);

		fetch(`/api/admin/listings?${params}`)
			.then((r) => r.json())
			.then((data) => {
				setListings(data.listings || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [search, statusFilter, categoryFilter, featuredFilter]);

	const columns = [
		{
			key: 'title',
			label: 'Título',
			render: (l: Listing) => (
				<div className="flex items-center gap-2">
					<span className="truncate">{l.title}</span>
					{l.featured && (
						<Star className="h-3.5 w-3.5 fill-primary text-primary" aria-label="Destacado" />
					)}
				</div>
			),
		},
		{
			key: 'category',
			label: 'Categoria',
			render: (l: Listing) => labelOf(CATEGORIES, l.category),
			className: 'w-32',
		},
		{
			key: 'status',
			label: 'Status',
			render: (l: Listing) => (
				<span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
					l.status === 'disponivel'
						? 'bg-green-100 text-green-700'
						: l.status === 'inativo'
						? 'bg-red-100 text-red-700'
						: 'bg-gray-100 text-gray-700'
				}`}>
					{l.status === 'disponivel' ? 'Ativo' : l.status === 'inativo' ? 'Inativo' : l.status}
				</span>
			),
			className: 'w-24',
		},
		{
			key: 'price',
			label: 'Preço',
			render: (l: Listing) => l.price != null ? `R$ ${l.price.toFixed(2)}` : '—',
			className: 'w-24',
		},
		{
			key: 'created_at',
			label: 'Criado',
			render: (l: Listing) => new Date(l.created_at).toLocaleDateString('pt-BR'),
			className: 'w-28',
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Package className="h-6 w-6 text-primary" />
				<h1 className="font-display text-2xl font-bold">Anúncios</h1>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1 sm:max-w-xs">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Buscar por título..."
						className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
					/>
				</div>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
				>
					<option value="all">Todos os status</option>
					<option value="disponivel">Ativo</option>
					<option value="inativo">Inativo</option>
					<option value="reservado">Reservado</option>
					<option value="vendido">Vendido</option>
				</select>
				<select
					value={categoryFilter}
					onChange={(e) => setCategoryFilter(e.target.value)}
					className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
				>
					<option value="all">Todas as categorias</option>
					{CATEGORIES.map((cat) => (
						<option key={cat.value} value={cat.value}>{cat.label}</option>
					))}
				</select>
				<select
					value={featuredFilter}
					onChange={(e) => setFeaturedFilter(e.target.value)}
					className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
				>
					<option value="all">Todos</option>
					<option value="true">Destacados</option>
					<option value="false">Não destacados</option>
				</select>
			</div>

			{loading ? (
				<p className="text-muted-foreground">Carregando...</p>
			) : (
				<DataTable
					columns={columns}
					data={listings}
					emptyMessage="Nenhum anúncio encontrado."
					onRowClick={(l) => router.push(`/admin/anuncios/${l.id}`)}
				/>
			)}
		</div>
	);
}
