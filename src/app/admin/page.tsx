import { Shield } from 'lucide-react';

export default function AdminDashboardPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Shield className="h-6 w-6 text-primary" />
				<h1 className="font-display text-2xl font-bold">Painel Admin</h1>
			</div>
			<p className="text-muted-foreground">
				Selecione uma opção no menu lateral para gerenciar a plataforma.
			</p>
		</div>
	);
}
