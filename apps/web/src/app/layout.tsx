import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

export const metadata: Metadata = {
	title: {
		default: 'ReEduca — troque, venda ou doe material escolar',
		template: '%s | ReEduca',
	},
	description:
		'ReEduca é a plataforma onde estudantes vendem, trocam ou doam livros, apostilas, mochilas e materiais escolares que não usam mais.',
};

// O shell usa estado de auth do Clerk em todas as rotas; evita prerender
// estático das páginas de erro do Next com o provider do Clerk.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<ClerkProvider>
			<html lang="pt-BR">
				<body>
					<AppShell>{children}</AppShell>
				</body>
			</html>
		</ClerkProvider>
	);
}
