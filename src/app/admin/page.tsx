'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatsCard } from '@/components/admin/StatsCard';

interface Stats {
	totalUsers: number;
	usersToday: number;
	users7d: number;
	users30d: number;
	activeListings: number;
	pendingReports: number;
	totalMessages: number;
	top5Categories: { name: string; count: number }[];
	top5Regions: { name: string; count: number }[];
	dailyData: { date: string; users: number }[];
}

export default function AdminDashboardPage() {
	const [stats, setStats] = useState<Stats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/admin/stats')
			.then((r) => r.json())
			.then((data) => {
				setStats(data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	if (loading) {
		return <p className="text-muted-foreground">Carregando métricas...</p>;
	}

	if (!stats) {
		return <p className="text-destructive">Erro ao carregar métricas.</p>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<BarChart3 className="h-6 w-6 text-primary" />
				<h1 className="font-display text-2xl font-bold">Dashboard</h1>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatsCard label="Usuários totais" value={stats.totalUsers} />
				<StatsCard label="Usuários hoje" value={stats.usersToday} />
				<StatsCard label="Anúncios ativos" value={stats.activeListings} />
				<StatsCard label="Denúncias pendentes" value={stats.pendingReports} />
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<StatsCard label="Usuários (7 dias)" value={stats.users7d} />
				<StatsCard label="Usuários (30 dias)" value={stats.users30d} />
				<StatsCard label="Total de mensagens" value={stats.totalMessages} />
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-xl border border-border bg-card p-4">
					<h2 className="mb-4 font-semibold">Novos usuários (30 dias)</h2>
					<ResponsiveContainer width="100%" height={250}>
						<BarChart data={stats.dailyData}>
							<XAxis
								dataKey="date"
								tickFormatter={(v: string) => v.slice(5)}
								fontSize={11}
							/>
							<YAxis allowDecimals={false} fontSize={11} />
							<Tooltip />
							<Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div className="space-y-6">
					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-3 font-semibold">Top categorias</h2>
						<ul className="space-y-2">
							{stats.top5Categories.map((c) => (
								<li key={c.name} className="flex items-center justify-between text-sm">
									<span className="capitalize">{c.name}</span>
									<span className="font-mono text-muted-foreground">{c.count}</span>
								</li>
							))}
							{stats.top5Categories.length === 0 && (
								<li className="text-sm text-muted-foreground">Nenhum anúncio</li>
							)}
						</ul>
					</div>

					<div className="rounded-xl border border-border bg-card p-4">
						<h2 className="mb-3 font-semibold">Top regiões</h2>
						<ul className="space-y-2">
							{stats.top5Regions.map((r) => (
								<li key={r.name} className="flex items-center justify-between text-sm">
									<span>{r.name}</span>
									<span className="font-mono text-muted-foreground">{r.count}</span>
								</li>
							))}
							{stats.top5Regions.length === 0 && (
								<li className="text-sm text-muted-foreground">Nenhum anúncio</li>
							)}
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
