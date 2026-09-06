'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface Report {
	id: string;
	reason: string;
	kind: string;
	status: string;
	created_at: string;
	reporter: { id: string; name: string } | null;
	listing: { id: string; title: string } | null;
}

const statusBadge: Record<string, { label: string; color: string }> = {
	pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
	avaliado: { label: 'Avaliado', color: 'bg-blue-100 text-blue-800' },
	dispensado: { label: 'Dispensado', color: 'bg-gray-100 text-gray-800' },
};

export default function AdminDenunciasPage() {
	const router = useRouter();
	const [reports, setReports] = useState<Report[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState('all');
	const [kindFilter, setKindFilter] = useState('all');

	useEffect(() => {
		const params = new URLSearchParams();
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (kindFilter !== 'all') params.set('kind', kindFilter);

		fetch(`/api/admin/reports?${params}`)
			.then((r) => r.json())
			.then((data) => {
				setReports(data.reports || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [statusFilter, kindFilter]);

	const columns = [
		{
			key: 'kind',
			label: 'Tipo',
			render: (r: Report) => <span className="capitalize">{r.kind}</span>,
			className: 'w-24',
		},
		{
			key: 'reason',
			label: 'Motivo',
			render: (r: Report) => (
				<span className="line-clamp-1 max-w-xs">{r.reason}</span>
			),
		},
		{
			key: 'listing',
			label: 'Anúncio',
			render: (r: Report) => r.listing?.title ?? <span className="text-muted-foreground">-</span>,
		},
		{
			key: 'reporter',
			label: 'Denunciante',
			render: (r: Report) => r.reporter?.name ?? <span className="text-muted-foreground">Anônimo</span>,
		},
		{
			key: 'status',
			label: 'Status',
			render: (r: Report) => {
				const badge = statusBadge[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-800' };
				return (
					<span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
						{badge.label}
					</span>
				);
			},
			className: 'w-28',
		},
		{
			key: 'created_at',
			label: 'Data',
			render: (r: Report) => new Date(r.created_at).toLocaleDateString('pt-BR'),
			className: 'w-24',
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<AlertTriangle className="h-6 w-6 text-primary" />
				<h1 className="font-display text-2xl font-bold">Denúncias</h1>
			</div>

			<div className="flex flex-wrap gap-3">
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
				>
					<option value="all">Todos os status</option>
					<option value="pendente">Pendente</option>
					<option value="avaliado">Avaliado</option>
					<option value="dispensado">Dispensado</option>
				</select>
				<select
					value={kindFilter}
					onChange={(e) => setKindFilter(e.target.value)}
					className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
				>
					<option value="all">Todos os tipos</option>
					<option value="listing">Anúncio</option>
					<option value="user">Usuário</option>
					<option value="message">Mensagem</option>
				</select>
			</div>

			{loading ? (
				<p className="text-muted-foreground">Carregando...</p>
			) : (
				<DataTable
					columns={columns}
					data={reports}
					emptyMessage="Nenhuma denúncia encontrada."
					onRowClick={(r) => router.push(`/admin/denuncias/${r.id}`)}
				/>
			)}
		</div>
	);
}
