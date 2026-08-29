import { Search, MessageCircle, PackageCheck } from 'lucide-react';

const steps = [
	{
		icon: Search,
		title: 'Encontre',
		description: 'Busque livros, apostilas e materiais perto de você por cidade e categoria.',
	},
	{
		icon: MessageCircle,
		title: 'Converse',
		description: 'Fale direto com o anunciante pelo chat integrado. Sem intermediários.',
	},
	{
		icon: PackageCheck,
		title: 'Combine',
		description: 'Defina se é venda, troca ou doação e combine a entrega.',
	},
];

export function HowItWorks() {
	return (
		<section className="mx-auto w-full max-w-6xl px-4 py-10">
			<h2 className="text-center font-display text-xl font-extrabold">Como funciona</h2>
			<div className="mt-8 grid gap-6 sm:grid-cols-3">
				{steps.map((step, i) => (
					<div
						key={step.title}
						className="relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center"
					>
						<span className="absolute -top-3 left-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
							{i + 1}
						</span>
						<div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
							<step.icon className="h-6 w-6 text-primary" />
						</div>
						<h3 className="font-display text-base font-bold">{step.title}</h3>
						<p className="text-sm leading-relaxed text-muted-foreground">
							{step.description}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
