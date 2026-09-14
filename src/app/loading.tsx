import { Dukinha } from '@/components/Dukinha';

export default function Loading() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
			<Dukinha className="h-16 w-16 animate-bounce" />
			<p className="text-sm text-muted-foreground">Carregando…</p>
		</div>
	);
}
