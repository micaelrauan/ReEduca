'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, CheckCircle, Ban, Eye } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface ReportDetail {
	id: string;
	reason: string;
	kind: string;
	status: string;
	note: string | null;
	created_at: string;
	reviewed_at: string | null;
	reporter: { id: string; name: string; email: string } | null;
	listing: { id: string; title: string; category: string; status: string } | null;
}

export default function AdminDenunciaDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	const [report, setReport] = useState<ReportDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [note, setNote] = useState('');
	const [actionNote, setActionNote] = useState('');
	const [confirmAction, setConfirmAction] = useState<'dismiss' | 'hide_listing' | 'ban_user' | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetch(`/api/admin/reports/${id}`)
			.then((r) => r.json())
			.then((data) => {
				setReport(data.report);
				setNote(data.report?.note || '');
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [id]);

	const executeAction = async () => {
		if (!confirmAction) return;
		setSaving(true);

		await fetch(`/api/admin/reports/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				status: 'avaliado',
				note,
				action: confirmAction,
				actionNote,
			}),
		});

		setSaving(false);
		setConfirmAction(null);
		setActionNote('');

		// Refresh
		const res = await fetch(`/api/admin/reports/${id}`);
		const data = await res.json();
		setReport(data.report);
	};

	const actionLabels: Record<string, { title: string; description: string }> = {
		dismiss: {
			title: 'Dispensar denúncia',
			description: 'A denúncia será marcada como dispensada e nenhuma ação será tomada.',
		},
		hide_listing: {
			title: 'Ocultar anúncio',
			description: 'O anúncio denunciado será marcado como inativo e não aparecerá mais na busca.',
		},
		ban_user: {
			title: 'Banir usuário',
			description: 'O usuário denunciado será banido e não poderá mais usar a plataforma.',
		},
	};

	if (loading) return <p className="text-muted-foreground">Carregando...</p>;
	if (!report) return <p className="text-destructive">Denúncia não encontrada.</p>;

	const statusBadge: Record<string, { label: string; color: string }> = {
		pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
		avaliado: { label: 'Avaliado', color: 'bg-blue-100 text-blue-800' },
		dispensado: { label: 'Dispensado', color: 'bg-gray-100 text-gray-800' },
	};
	const badge = statusBadge[report.status] || { label: report.status, color: 'bg-gray-100 text-gray-800' };

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
				<h1 className="font-display text-2xl font-bold">Denúncia #{report.id.slice(0, 8)}</h1>
				<span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
					{badge.label}
				</span>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-4">
					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-2 font-semibold">Detalhes</h2>
						<dl className="space-y-2 text-sm">
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Tipo</dt>
								<dd className="capitalize">{report.kind}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Data</dt>
								<dd>{new Date(report.created_at).toLocaleString('pt-BR')}</dd>
							</div>
							{report.reviewed_at && (
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Avaliado em</dt>
									<dd>{new Date(report.reviewed_at).toLocaleString('pt-BR')}</dd>
								</div>
							)}
						</dl>
					</div>

					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-2 font-semibold">Motivo</h2>
						<p className="text-sm text-muted-foreground">{report.reason}</p>
					</div>

					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-2 font-semibold">Nota administrativa</h2>
						<textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="Adicione uma nota sobre esta denúncia..."
							className="w-full rounded-lg border border-border bg-background p-2 text-sm"
							rows={3}
						/>
						<button
							type="button"
							onClick={async () => {
								setSaving(true);
								await fetch(`/api/admin/reports/${id}`, {
									method: 'PATCH',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ note }),
								});
								setSaving(false);
							}}
							disabled={saving}
							className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
						>
							Salvar nota
						</button>
					</div>
				</div>

				<div className="space-y-4">
					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-2 font-semibold">Denunciante</h2>
						{report.reporter ? (
							<div className="space-y-1 text-sm">
								<p>{report.reporter.name}</p>
								<p className="text-muted-foreground">{report.reporter.email}</p>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">Anônimo</p>
						)}
					</div>

					{report.listing && (
						<div className="rounded-xl border border-border bg-card p-4">
							<h2 className="mb-2 font-semibold">Anúncio</h2>
							<div className="space-y-1 text-sm">
								<p>{report.listing.title}</p>
								<p className="text-muted-foreground">Categoria: {report.listing.category}</p>
								<p className="text-muted-foreground">Status: {report.listing.status}</p>
								<a
									href={`/anuncio/${report.listing.id}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-primary hover:underline"
								>
									Ver anúncio <ExternalLink className="h-3 w-3" />
								</a>
							</div>
						</div>
					)}

					{report.status === 'pendente' && (
						<div className="rounded-xl border border-border bg-card p-4">
							<h2 className="mb-3 font-semibold">Ações</h2>
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => setConfirmAction('dismiss')}
									className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
								>
									<CheckCircle className="h-4 w-4" />
									Dispensar
								</button>
								{report.listing && (
									<button
										type="button"
										onClick={() => setConfirmAction('hide_listing')}
										className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
									>
										<Eye className="h-4 w-4" />
										Ocultar anúncio
									</button>
								)}
								{report.reporter && (
									<button
										type="button"
										onClick={() => setConfirmAction('ban_user')}
										className="flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
									>
										<Ban className="h-4 w-4" />
										Banir usuário
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{confirmAction && (
				<ConfirmDialog
					open={!!confirmAction}
					title={actionLabels[confirmAction].title}
					description={actionLabels[confirmAction].description}
					confirmLabel={confirmAction === 'ban_user' ? 'Banir' : 'Confirmar'}
					variant={confirmAction === 'ban_user' ? 'danger' : 'default'}
					onConfirm={executeAction}
					onCancel={() => {
						setConfirmAction(null);
						setActionNote('');
					}}
				/>
			)}
		</div>
	);
}
