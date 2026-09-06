'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Shield } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface User {
	id: string;
	name: string | null;
	email: string;
	role: string;
	banned_at: string | null;
	created_at: string;
}

export default function AdminUsuariosPage() {
	const router = useRouter();
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [roleFilter, setRoleFilter] = useState('all');
	const [bannedFilter, setBannedFilter] = useState('all');

	useEffect(() => {
		const params = new URLSearchParams();
		if (search) params.set('search', search);
		if (roleFilter !== 'all') params.set('role', roleFilter);
		if (bannedFilter !== 'all') params.set('banned', bannedFilter);

		fetch(`/api/admin/users?${params}`)
			.then((r) => r.json())
			.then((data) => {
				setUsers(data.users || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [search, roleFilter, bannedFilter]);

	const columns = [
		{
			key: 'name',
			label: 'Nome',
			render: (u: User) => (
				<div className="flex items-center gap-2">
					<span>{u.name || <span className="text-muted-foreground">Sem nome</span>}</span>
					{u.role === 'admin' && (
						<Shield className="h-3.5 w-3.5 text-primary" aria-label="Admin" />
					)}
					{u.banned_at && (
						<span className="inline-block rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
							Banido
						</span>
					)}
				</div>
			),
		},
		{
			key: 'email',
			label: 'Email',
			render: (u: User) => <span className="text-muted-foreground">{u.email}</span>,
		},
		{
			key: 'role',
			label: 'Função',
			render: (u: User) => (
				<span className="capitalize">{u.role === 'admin' ? 'Admin' : 'Usuário'}</span>
			),
			className: 'w-24',
		},
		{
			key: 'created_at',
			label: 'Cadastro',
			render: (u: User) => new Date(u.created_at).toLocaleDateString('pt-BR'),
			className: 'w-28',
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Users className="h-6 w-6 text-primary" />
				<h1 className="font-display text-2xl font-bold">Usuários</h1>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1 sm:max-w-xs">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Buscar por nome ou email..."
						className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
					/>
				</div>
				<select
					value={roleFilter}
					onChange={(e) => setRoleFilter(e.target.value)}
					className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
				>
					<option value="all">Todas as funções</option>
					<option value="admin">Admin</option>
					<option value="user">Usuário</option>
				</select>
				<select
					value={bannedFilter}
					onChange={(e) => setBannedFilter(e.target.value)}
					className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
				>
					<option value="all">Todos</option>
					<option value="true">Banidos</option>
					<option value="false">Não banidos</option>
				</select>
			</div>

			{loading ? (
				<p className="text-muted-foreground">Carregando...</p>
			) : (
				<DataTable
					columns={columns}
					data={users}
					emptyMessage="Nenhum usuário encontrado."
					onRowClick={(u) => router.push(`/admin/usuarios/${u.id}`)}
				/>
			)}
		</div>
	);
}
