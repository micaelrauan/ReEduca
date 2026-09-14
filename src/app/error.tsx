'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Dukinha } from '@/components/Dukinha';

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
			<Dukinha className="h-24 w-24" />
			<h1 className="font-display text-2xl font-extrabold">Algo deu errado</h1>
			<p className="max-w-md text-sm text-muted-foreground">
				Ocorreu um erro inesperado. Tente recarregar a página ou volte para o início.
			</p>
			<div className="flex gap-3">
				<button
					type="button"
					onClick={() => reset()}
					className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
				>
					Tentar novamente
				</button>
				<a
					href="/"
					className="rounded-full border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
				>
					Voltar ao início
				</a>
			</div>
		</div>
	);
}
