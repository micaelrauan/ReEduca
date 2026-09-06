'use client';

import { Settings, ExternalLink } from 'lucide-react';

export default function AdminConfigPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Settings className="h-6 w-6 text-primary" />
				<h1 className="font-display text-2xl font-bold">Configurações</h1>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="rounded-xl border border-border bg-card p-6">
					<h2 className="mb-4 font-semibold">Sistema</h2>
					<dl className="space-y-3 text-sm">
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Versão</dt>
							<dd className="font-mono">1.0.0</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Framework</dt>
							<dd>Next.js 15</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Banco de dados</dt>
							<dd>Supabase Postgres</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Autenticação</dt>
							<dd>Clerk</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Última atualização</dt>
							<dd>{new Date().toLocaleDateString('pt-BR')}</dd>
						</div>
					</dl>
				</div>

				<div className="rounded-xl border border-border bg-card p-6">
					<h2 className="mb-4 font-semibold">Links úteis</h2>
					<ul className="space-y-3 text-sm">
						<li>
							<a
								href="https://supabase.com/dashboard"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-primary hover:underline"
							>
								<ExternalLink className="h-4 w-4" />
								Dashboard do Supabase
							</a>
						</li>
						<li>
							<a
								href="https://dashboard.clerk.com"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-primary hover:underline"
							>
								<ExternalLink className="h-4 w-4" />
								Dashboard do Clerk
							</a>
						</li>
						<li>
							<a
								href="/api/admin/check"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-primary hover:underline"
							>
								<ExternalLink className="h-4 w-4" />
								API Status Check
							</a>
						</li>
					</ul>
				</div>

				<div className="rounded-xl border border-border bg-card p-6 md:col-span-2">
					<h2 className="mb-4 font-semibold">Estatísticas do Painel</h2>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-primary">8</p>
							<p className="text-xs text-muted-foreground">Módulos</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold text-primary">14</p>
							<p className="text-xs text-muted-foreground">APIs</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold text-primary">9</p>
							<p className="text-xs text-muted-foreground">Páginas</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold text-primary">5</p>
							<p className="text-xs text-muted-foreground">Componentes</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
