'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, ShieldOff, Ban, UserCheck } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface UserDetail {
	id: string;
	name: string | null;
	email: string;
	role: string;
	banned_at: string | null;
	ban_reason: string | null;
	created_at: string;
	stats: {
		listings: number;
		reports: number;
		messages: number;
	};
}

export default function AdminUsuarioDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	const [user, setUser] = useState<UserDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [confirmAction, setConfirmAction] = useState<'ban' | 'unban' | 'promote' | 'demote' | null>(null);
	const [banReason, setBanReason] = useState('');

	useEffect(() => {
		fetch(`/api/admin/users/${id}`)
			.then((r) => r.json())
			.then((data) => {
				setUser(data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [id]);

	const executeAction = async () => {
		if (!confirmAction) return;

		const body: Record<string, string> = { action: confirmAction };
		if (confirmAction === 'ban' && banReason) body.banReason = banReason;

		await fetch(`/api/admin/users/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

		setConfirmAction(null);
		setBanReason('');

		// Refresh
		const res = await fetch(`/api/admin/users/${id}`);
		const data = await res.json();
		setUser(data);
	};

	const actionLabels: Record<string, { title: string; description: string }> = {
		ban: {
			title: 'Banir usuário',
			description: 'O usuário será banido e não poderá mais usar a plataforma.',
		},
		unban: {
			title: 'Desbanir usuário',
			description: 'O usuário será desbanido e poderá voltar a usar a plataforma.',
		},
		promote: {
			title: 'Promover a admin',
			description: 'O usuário ganhará acesso ao painel administrativo.',
		},
		demote: {
			title: 'Rebaixar de admin',
			description: 'O usuário perderá o acesso ao painel administrativo.',
		},
	};

	if (loading) return <p className="text-muted-foreground">Carregando...</p>;
	if (!user) return <p className="text-destructive">Usuário não encontrado.</p>;

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
				<h1 className="font-display text-2xl font-bold">{user.name || user.email}</h1>
				{user.role === 'admin' && (
					<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
						<Shield className="h-3 w-3" />
						Admin
					</span>
				)}
				{user.banned_at && (
					<span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
						<Ban className="h-3 w-3" />
						Banido
					</span>
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="space-y-4">
					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-2 font-semibold">Informações</h2>
						<dl className="space-y-2 text-sm">
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Email</dt>
								<dd>{user.email}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Função</dt>
								<dd className="capitalize">{user.role === 'admin' ? 'Admin' : 'Usuário'}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Cadastro</dt>
								<dd>{new Date(user.created_at).toLocaleString('pt-BR')}</dd>
							</div>
							{user.banned_at && (
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Banido em</dt>
									<dd>{new Date(user.banned_at).toLocaleString('pt-BR')}</dd>
								</div>
							)}
							{user.ban_reason && (
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Motivo do ban</dt>
									<dd>{user.ban_reason}</dd>
								</div>
							)}
						</dl>
					</div>

					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-2 font-semibold">Estatísticas</h2>
						<dl className="space-y-2 text-sm">
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Anúncios criados</dt>
								<dd className="font-mono">{user.stats.listings}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Denúncias feitas</dt>
								<dd className="font-mono">{user.stats.reports}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Mensagens enviadas</dt>
								<dd className="font-mono">{user.stats.messages}</dd>
							</div>
						</dl>
					</div>
				</div>

				<div className="space-y-4">
					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-3 font-semibold">Ações</h2>
						<div className="flex flex-wrap gap-2">
							{user.banned_at ? (
								<button
									type="button"
									onClick={() => setConfirmAction('unban')}
									className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
								>
									<UserCheck className="h-4 w-4" />
									Desbanir
								</button>
							) : (
								<button
									type="button"
									onClick={() => setConfirmAction('ban')}
									className="flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
								>
									<Ban className="h-4 w-4" />
									Banir
								</button>
							)}

							{user.role === 'admin' ? (
								<button
									type="button"
									onClick={() => setConfirmAction('demote')}
									className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
								>
									<ShieldOff className="h-4 w-4" />
									Rebaixar
								</button>
							) : (
								<button
									type="button"
									onClick={() => setConfirmAction('promote')}
									className="flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
								>
									<Shield className="h-4 w-4" />
									Promover a admin
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{confirmAction && (
				<ConfirmDialog
					open={!!confirmAction}
					title={actionLabels[confirmAction].title}
					description={actionLabels[confirmAction].description}
					confirmLabel={confirmAction === 'ban' ? 'Banir' : confirmAction === 'unban' ? 'Desbanir' : 'Confirmar'}
					variant={confirmAction === 'ban' ? 'danger' : 'default'}
					onConfirm={executeAction}
					onCancel={() => {
						setConfirmAction(null);
						setBanReason('');
					}}
				/>
			)}
		</div>
	);
}
