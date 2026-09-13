'use client';

import { useState, useEffect, useCallback } from 'react';
import {
	Users,
	ListIcon,
	MessageCircle,
	Star,
	Download,
	Shield,
	AlertTriangle,
	RefreshCw,
	Wrench,
	Activity,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface HealthData {
	tables: Record<string, number>;
	suspicious: Record<string, number>;
}

interface ActionResult {
	ok: boolean;
	action: string;
	result: unknown;
}

type MaintenanceAction =
	| 'export_users'
	| 'export_listings'
	| 'export_reports'
	| 'export_messages'
	| 'health_report'
	| 'ban_all_users'
	| 'delete_banned_users'
	| 'hide_all_listings'
	| 'restore_all_listings'
	| 'delete_inactive_listings'
	| 'delete_all_listings'
	| 'unfeature_all'
	| 'dismiss_all_reports'
	| 'delete_all_reports'
	| 'delete_all_messages'
	| 'delete_messages_older_than'
	| 'delete_favorites'
	| 'delete_all_ratings'
	| 'reset_fav_counts'
	| 'purge_soft_deleted'
	| 'clear_admin_log';

function downloadJson(data: unknown, filename: string) {
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function SectionCard({
	title,
	icon: Icon,
	children,
	variant = 'default',
}: {
	title: string;
	icon: React.ElementType;
	children: React.ReactNode;
	variant?: 'default' | 'danger' | 'success';
}) {
	const colors = {
		default: 'text-primary',
		danger: 'text-destructive',
		success: 'text-emerald-600',
	};
	return (
		<div className="rounded-xl border border-border bg-card p-6">
			<div className="mb-4 flex items-center gap-2">
				<Icon className={`h-5 w-5 ${colors[variant]}`} />
				<h2 className="font-display text-lg font-bold">{title}</h2>
			</div>
			{children}
		</div>
	);
}

function ActionButton({
	label,
	onClick,
	loading,
	variant = 'default',
	disabled,
}: {
	label: string;
	onClick: () => void;
	loading?: boolean;
	variant?: 'default' | 'danger' | 'success' | 'outline';
	disabled?: boolean;
}) {
	const styles = {
		default: 'bg-primary text-white hover:bg-primary/90',
		danger: 'bg-destructive text-white hover:bg-destructive/90',
		success: 'bg-emerald-600 text-white hover:bg-emerald-700',
		outline: 'border border-border bg-transparent hover:bg-muted',
	};
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={loading || disabled}
			className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]}`}
		>
			{loading ? 'Executando...' : label}
		</button>
	);
}

export default function AdminManutencaoPage() {
	const [health, setHealth] = useState<HealthData | null>(null);
	const [loading, setLoading] = useState<Record<string, boolean>>({});
	const [result, setResult] = useState<ActionResult | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingAction, setPendingAction] = useState<{
		action: MaintenanceAction;
		label: string;
		params?: Record<string, unknown>;
	} | null>(null);
	const [confirmText, setConfirmText] = useState('');
	const [daysInput, setDaysInput] = useState('30');
	const [daysDialogOpen, setDaysDialogOpen] = useState(false);

	const loadHealth = useCallback(async () => {
		setLoading((prev) => ({ ...prev, health: true }));
		try {
			const res = await fetch('/api/admin/maintenance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'health_report' }),
			});
			const data = await res.json();
			if (data.ok) setHealth(data.result as HealthData);
		} finally {
			setLoading((prev) => ({ ...prev, health: false }));
		}
	}, []);

	useEffect(() => {
		loadHealth();
	}, [loadHealth]);

	async function executeAction(action: MaintenanceAction, params?: Record<string, unknown>) {
		setLoading((prev) => ({ ...prev, [action]: true }));
		setResult(null);
		try {
			const res = await fetch('/api/admin/maintenance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action, params, confirm: true }),
			});
			const data = await res.json();
			setResult(data);
			if (action === 'health_report' && data.ok) {
				setHealth(data.result as HealthData);
			}
		} catch {
			setResult({ ok: false, action, result: 'Erro de conexão' });
		} finally {
			setLoading((prev) => ({ ...prev, [action]: false }));
		}
	}

	function handleDestructive(action: MaintenanceAction, label: string, params?: Record<string, unknown>) {
		setPendingAction({ action, label, params });
		setConfirmText('');
		setConfirmOpen(true);
	}

	function handleConfirm() {
		if (!pendingAction) return;
		executeAction(pendingAction.action, pendingAction.params);
		setConfirmOpen(false);
		setPendingAction(null);
		setConfirmText('');
	}

	function handleDaysConfirm() {
		setDaysDialogOpen(false);
		executeAction('delete_messages_older_than', { days: Number(daysInput) || 30 });
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Wrench className="h-6 w-6 text-primary" />
					<h1 className="font-display text-2xl font-bold">Manutenção</h1>
				</div>
				<button
					type="button"
					onClick={loadHealth}
					disabled={loading.health}
					className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
				>
					<RefreshCw className={`h-4 w-4 ${loading.health ? 'animate-spin' : ''}`} />
					Atualizar
				</button>
			</div>

			{result && (
				<div
					className={`rounded-lg border p-4 text-sm ${
						result.ok
							? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
							: 'border-destructive/20 bg-destructive/5 text-destructive'
					}`}
				>
					<strong>{result.action}:</strong>{' '}
					{result.ok ? JSON.stringify(result.result) : String(result.result)}
				</div>
			)}

			{/* SAÚDE DO SISTEMA */}
			<SectionCard title="Saúde do Sistema" icon={Activity} variant="success">
				{health ? (
					<div className="grid gap-6 sm:grid-cols-2">
						<div>
							<h3 className="mb-2 text-sm font-semibold text-muted-foreground">Registros por tabela</h3>
							<dl className="space-y-1 text-sm">
								{Object.entries(health.tables).map(([table, count]) => (
									<div key={table} className="flex justify-between">
										<dt className="text-muted-foreground">{table}</dt>
										<dd className="font-mono">{count.toLocaleString('pt-BR')}</dd>
									</div>
								))}
							</dl>
						</div>
						<div>
							<h3 className="mb-2 text-sm font-semibold text-muted-foreground">Itens de atenção</h3>
							<dl className="space-y-1 text-sm">
								{Object.entries(health.suspicious).map(([key, count]) => (
									<div key={key} className="flex justify-between">
										<dt className="text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
										<dd className={`font-mono ${count > 0 ? 'text-amber-600' : ''}`}>
											{count.toLocaleString('pt-BR')}
										</dd>
									</div>
								))}
							</dl>
						</div>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">Carregando...</p>
				)}
			</SectionCard>

			{/* EXPORTAR DADOS */}
			<SectionCard title="Exportar Dados" icon={Download}>
				<p className="mb-4 text-sm text-muted-foreground">
					Exporta dados em JSON para backup. Nenhuma alteração é feita.
				</p>
				<div className="flex flex-wrap gap-3">
					<ActionButton
						label="Exportar Usuários"
						onClick={async () => {
							setLoading((p) => ({ ...p, export_users: true }));
							const res = await fetch('/api/admin/maintenance', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ action: 'export_users' }),
							});
							const data = await res.json();
							if (data.ok) downloadJson(data.result, `usuarios-${new Date().toISOString().slice(0, 10)}.json`);
							setLoading((p) => ({ ...p, export_users: false }));
						}}
						loading={loading.export_users}
						variant="outline"
					/>
					<ActionButton
						label="Exportar Anúncios"
						onClick={async () => {
							setLoading((p) => ({ ...p, export_listings: true }));
							const res = await fetch('/api/admin/maintenance', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ action: 'export_listings' }),
							});
							const data = await res.json();
							if (data.ok) downloadJson(data.result, `anuncios-${new Date().toISOString().slice(0, 10)}.json`);
							setLoading((p) => ({ ...p, export_listings: false }));
						}}
						loading={loading.export_listings}
						variant="outline"
					/>
					<ActionButton
						label="Exportar Denúncias"
						onClick={async () => {
							setLoading((p) => ({ ...p, export_reports: true }));
							const res = await fetch('/api/admin/maintenance', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ action: 'export_reports' }),
							});
							const data = await res.json();
							if (data.ok) downloadJson(data.result, `denuncias-${new Date().toISOString().slice(0, 10)}.json`);
							setLoading((p) => ({ ...p, export_reports: false }));
						}}
						loading={loading.export_reports}
						variant="outline"
					/>
					<ActionButton
						label="Exportar Mensagens"
						onClick={async () => {
							setLoading((p) => ({ ...p, export_messages: true }));
							const res = await fetch('/api/admin/maintenance', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ action: 'export_messages' }),
							});
							const data = await res.json();
							if (data.ok) downloadJson(data.result, `mensagens-${new Date().toISOString().slice(0, 10)}.json`);
							setLoading((p) => ({ ...p, export_messages: false }));
						}}
						loading={loading.export_messages}
						variant="outline"
					/>
				</div>
			</SectionCard>

			{/* USUÁRIOS */}
			<SectionCard title="Usuários" icon={Users}>
				<div className="flex flex-wrap gap-3">
					<ActionButton
						label="Banir todos (exceto admins)"
						onClick={() => handleDestructive('ban_all_users', 'Banir todos os usuários')}
						loading={loading.ban_all_users}
						variant="danger"
					/>
					<ActionButton
						label="Remover banidos permanentemente"
						onClick={() => handleDestructive('delete_banned_users', 'Deletar todos os usuários banidos')}
						loading={loading.delete_banned_users}
						variant="danger"
					/>
				</div>
			</SectionCard>

			{/* ANÚNCIOS */}
			<SectionCard title="Anúncios" icon={ListIcon}>
				<div className="flex flex-wrap gap-3">
					<ActionButton
						label="Ocultar todos"
						onClick={() => executeAction('hide_all_listings')}
						loading={loading.hide_all_listings}
						variant="outline"
					/>
					<ActionButton
						label="Restaurar todos"
						onClick={() => executeAction('restore_all_listings')}
						loading={loading.restore_all_listings}
						variant="success"
					/>
					<ActionButton
						label="Remover destaque de todos"
						onClick={() => executeAction('unfeature_all')}
						loading={loading.unfeature_all}
						variant="outline"
					/>
					<ActionButton
						label="Deletar inativos"
						onClick={() => handleDestructive('delete_inactive_listings', 'Deletar anúncios inativos')}
						loading={loading.delete_inactive_listings}
						variant="danger"
					/>
					<ActionButton
						label="Deletar TODOS"
						onClick={() => handleDestructive('delete_all_listings', 'Deletar TODOS os anúncios')}
						loading={loading.delete_all_listings}
						variant="danger"
					/>
				</div>
			</SectionCard>

			{/* DENÚNCIAS */}
			<SectionCard title="Denúncias" icon={AlertTriangle}>
				<div className="flex flex-wrap gap-3">
					<ActionButton
						label="Dispensar todas pendentes"
						onClick={() => executeAction('dismiss_all_reports')}
						loading={loading.dismiss_all_reports}
						variant="outline"
					/>
					<ActionButton
						label="Deletar todas"
						onClick={() => handleDestructive('delete_all_reports', 'Deletar todas as denúncias')}
						loading={loading.delete_all_reports}
						variant="danger"
					/>
				</div>
			</SectionCard>

			{/* CHAT / MENSAGENS */}
			<SectionCard title="Chat e Mensagens" icon={MessageCircle}>
				<div className="flex flex-wrap gap-3">
					<ActionButton
						label="Deletar todas as mensagens"
						onClick={() => handleDestructive('delete_all_messages', 'Deletar TODAS as mensagens')}
						loading={loading.delete_all_messages}
						variant="danger"
					/>
					<ActionButton
						label="Deletar mensagens antigas..."
						onClick={() => setDaysDialogOpen(true)}
						loading={loading.delete_messages_older_than}
						variant="danger"
					/>
				</div>
			</SectionCard>

			{/* FAVORITOS E AVALIAÇÕES */}
			<SectionCard title="Favoritos e Avaliações" icon={Star}>
				<div className="flex flex-wrap gap-3">
					<ActionButton
						label="Limpar todos os favoritos"
						onClick={() => handleDestructive('delete_favorites', 'Limpar todos os favoritos')}
						loading={loading.delete_favorites}
						variant="danger"
					/>
					<ActionButton
						label="Deletar todas as avaliações"
						onClick={() => handleDestructive('delete_all_ratings', 'Deletar todas as avaliações')}
						loading={loading.delete_all_ratings}
						variant="danger"
					/>
					<ActionButton
						label="Resetar contagem de favoritos"
						onClick={() => executeAction('reset_fav_counts')}
						loading={loading.reset_fav_counts}
						variant="outline"
					/>
				</div>
			</SectionCard>

			{/* MANUTENÇÃO DO SISTEMA */}
			<SectionCard title="Sistema" icon={Shield} variant="danger">
				<div className="flex flex-wrap gap-3">
					<ActionButton
						label="Purgar soft-deletados"
						onClick={() => handleDestructive('purge_soft_deleted', 'Purgar listagens soft-deletadas')}
						loading={loading.purge_soft_deleted}
						variant="danger"
					/>
					<ActionButton
						label="Limpar log de ações admin"
						onClick={() => handleDestructive('clear_admin_log', 'Limpar log de admin_actions')}
						loading={loading.clear_admin_log}
						variant="danger"
					/>
				</div>
			</SectionCard>

			{/* DIALOG DE CONFIRMAÇÃO */}
			<ConfirmDialog
				open={confirmOpen}
				title={`Confirmar: ${pendingAction?.label ?? ''}`}
				description={`Esta ação é irreversível. Digite "CONFIRMAR" no campo abaixo para prosseguir.`}
				confirmLabel="Executar"
				variant="danger"
				onConfirm={handleConfirm}
				onCancel={() => {
					setConfirmOpen(false);
					setPendingAction(null);
					setConfirmText('');
				}}
			/>
			{confirmOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center">
					<div className="rounded-xl border border-border bg-background p-6 shadow-lg">
						<label className="mb-3 block text-sm font-medium">
							Digite <span className="font-bold">CONFIRMAR</span> para prosseguir:
						</label>
						<input
							type="text"
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
							autoFocus
						/>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => {
									setConfirmOpen(false);
									setPendingAction(null);
									setConfirmText('');
								}}
								className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleConfirm}
								disabled={confirmText !== 'CONFIRMAR'}
								className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
							>
								Executar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* DIALOG DE DIAS */}
			{daysDialogOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="rounded-xl border border-border bg-background p-6 shadow-lg">
						<h3 className="mb-4 font-display text-lg font-bold">Deletar mensagens antigas</h3>
						<label className="mb-2 block text-sm text-muted-foreground">
							Deletar mensagens com mais de X dias:
						</label>
						<input
							type="number"
							min="1"
							value={daysInput}
							onChange={(e) => setDaysInput(e.target.value)}
							className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
							autoFocus
						/>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setDaysDialogOpen(false)}
								className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleDaysConfirm}
								className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90"
							>
								Deletar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
