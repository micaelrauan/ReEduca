'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Eye, EyeOff } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { CATEGORIES, CONDITIONS, labelOf } from '@/lib/reeduca';

interface ListingDetail {
	id: string;
	title: string;
	description: string | null;
	category: string;
	condition: string;
	status: string;
	featured: boolean;
	price: number | null;
	photo_urls: string[];
	seller_name: string | null;
	owner_id: string;
	created_at: string;
	reports: Array<{
		id: string;
		reason: string;
		status: string;
		created_at: string;
	}>;
}

export default function AdminAnuncioDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	const [listing, setListing] = useState<ListingDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [confirmAction, setConfirmAction] = useState<'hide' | 'restore' | 'feature' | 'unfeature' | null>(null);

	useEffect(() => {
		fetch(`/api/admin/listings/${id}`)
			.then((r) => r.json())
			.then((data) => {
				setListing(data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [id]);

	const executeAction = async () => {
		if (!confirmAction) return;

		await fetch(`/api/admin/listings/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: confirmAction }),
		});

		setConfirmAction(null);

		// Refresh
		const res = await fetch(`/api/admin/listings/${id}`);
		const data = await res.json();
		setListing(data);
	};

	if (loading) return <p className="text-muted-foreground">Carregando...</p>;
	if (!listing) return <p className="text-destructive">Anúncio não encontrado.</p>;

	return (
		<div className="space-y-6">
			<button
				type="button"
				onClick={() => router.back()}
				className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				Voltar
			</button>

			<div className="flex items-center gap-3">
				<h1 className="font-display text-2xl font-bold">{listing.title}</h1>
				{listing.featured && (
					<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
						<Star className="h-3 w-3 fill-primary" />
						Destacado
					</span>
				)}
				<span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
					listing.status === 'disponivel'
						? 'bg-green-100 text-green-700'
						: listing.status === 'inativo'
						? 'bg-red-100 text-red-700'
						: 'bg-gray-100 text-gray-700'
				}`}>
					{listing.status === 'disponivel' ? 'Ativo' : listing.status === 'inativo' ? 'Inativo' : listing.status}
				</span>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-4">
					{listing.photo_urls && listing.photo_urls.length > 0 && (
						<div className="rounded-xl border border-border bg-card p-4">
							<h2 className="mb-2 font-semibold">Fotos</h2>
							<div className="grid grid-cols-3 gap-2">
								{listing.photo_urls.slice(0, 6).map((url, i) => (
									<img
										key={i}
										src={url}
										alt={`${listing.title} ${i + 1}`}
										className="aspect-square rounded-lg object-cover"
									/>
								))}
							</div>
						</div>
					)}

					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-2 font-semibold">Informações</h2>
						<dl className="space-y-2 text-sm">
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Categoria</dt>
								<dd>{labelOf(CATEGORIES, listing.category)}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Condição</dt>
								<dd>{labelOf(CONDITIONS, listing.condition)}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Preço</dt>
								<dd>{listing.price != null ? `R$ ${listing.price.toFixed(2)}` : 'Não informado'}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Criado em</dt>
								<dd>{new Date(listing.created_at).toLocaleString('pt-BR')}</dd>
							</div>
						</dl>
					</div>

					{listing.description && (
						<div className="rounded-xl border border-border bg-card p-4">
							<h2 className="mb-2 font-semibold">Descrição</h2>
							<p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
						</div>
					)}
				</div>

				<div className="space-y-4">
					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-3 font-semibold">Ações</h2>
						<div className="flex flex-wrap gap-2">
							{listing.status === 'inativo' ? (
								<button
									type="button"
									onClick={() => setConfirmAction('restore')}
									className="flex items-center gap-2 rounded-lg border border-green-300 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
								>
									<Eye className="h-4 w-4" />
									Restaurar
								</button>
							) : (
								<button
									type="button"
									onClick={() => setConfirmAction('hide')}
									className="flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
								>
									<EyeOff className="h-4 w-4" />
									Ocultar
								</button>
							)}

							{listing.featured ? (
								<button
									type="button"
									onClick={() => setConfirmAction('unfeature')}
									className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
								>
									<Star className="h-4 w-4" />
									Remover destaque
								</button>
							) : (
								<button
									type="button"
									onClick={() => setConfirmAction('feature')}
									className="flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
								>
									<Star className="h-4 w-4" />
									Destacar
								</button>
							)}
						</div>
					</div>

					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-2 font-semibold">Vendedor</h2>
						<dl className="space-y-2 text-sm">
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Nome</dt>
								<dd>{listing.seller_name || 'Não informado'}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">ID</dt>
								<dd className="font-mono text-xs">{listing.owner_id}</dd>
							</div>
						</dl>
					</div>

					{listing.reports && listing.reports.length > 0 && (
						<div className="rounded-xl border border-border bg-card p-4">
							<h2 className="mb-2 font-semibold">Denúncias ({listing.reports.length})</h2>
							<ul className="space-y-2 text-sm">
								{listing.reports.map((report) => (
									<li key={report.id} className="flex justify-between border-b border-border pb-2 last:border-0">
										<span className="text-muted-foreground">{report.reason}</span>
										<span className={`text-xs ${
											report.status === 'pending' ? 'text-yellow-600' : 'text-muted-foreground'
										}`}>
											{report.status}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</div>

			{confirmAction && (
				<ConfirmDialog
					open={!!confirmAction}
					title={confirmAction === 'hide' ? 'Ocultar anúncio' : confirmAction === 'restore' ? 'Restaurar anúncio' : confirmAction === 'feature' ? 'Destacar anúncio' : 'Remover destaque'}
					description={confirmAction === 'hide' ? 'O anúncio será ocultado e não aparecerá nas buscas.' : confirmAction === 'restore' ? 'O anúncio voltará a aparecer nas buscas.' : 'O anúncio terá destaque na homepage.'}
					confirmLabel="Confirmar"
					variant={confirmAction === 'hide' ? 'danger' : 'default'}
					onConfirm={executeAction}
					onCancel={() => setConfirmAction(null)}
				/>
			)}
		</div>
	);
}
