'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Dukinha } from '@/components/Dukinha';

export default function ChatError({
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
		<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
			<Dukinha className="h-20 w-20" />
			<h1 className="font-display text-xl font-extrabold">Erro no chat</h1>
			<p className="max-w-md text-sm text-muted-foreground">
				Não conseguimos carregar as mensagens. Verifique sua conexão e tente novamente.
			</p>
			<button
				type="button"
				onClick={() => reset()}
				className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
			>
				Tentar novamente
			</button>
		</div>
	);
}
