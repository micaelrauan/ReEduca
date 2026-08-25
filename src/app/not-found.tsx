import Link from 'next/link';
import { Dukinha } from '@/components/Dukinha';

export default function NotFound() {
	return (
		<div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
			<Dukinha className="h-28 w-28" />
			<h1 className="font-display text-xl font-extrabold">Página não encontrada</h1>
			<p className="text-sm text-muted-foreground">
				O Dukinha farejou tudo e não achou esta página.
			</p>
			<Link href="/" className="text-sm font-semibold text-primary">
				Voltar ao início
			</Link>
		</div>
	);
}
