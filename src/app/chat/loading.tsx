import { Dukinha } from '@/components/Dukinha';

export default function ChatLoading() {
	return (
		<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
			<Dukinha className="h-14 w-14 animate-bounce" />
			<p className="text-sm text-muted-foreground">Carregando conversa…</p>
		</div>
	);
}
