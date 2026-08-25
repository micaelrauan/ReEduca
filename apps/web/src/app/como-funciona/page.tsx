'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Dukinha } from '@/components/Dukinha';
import { cn } from '@/lib/utils';

const steps = [
	{
		title: 'Junte o que está parado',
		text: 'Livros do ano passado, apostilas, canetas, calculadora, mochila. Se não usa mais, alguém precisa.',
	},
	{
		title: 'Anuncie em 2 minutos',
		text: 'Tire até 5 fotos, escolha a categoria, diga o estado e se é venda, troca ou doação.',
	},
	{
		title: 'Combine pelo chat',
		text: 'Converse dentro do ReEduca, ajuste o ponto de encontro e feche a negociação com segurança.',
	},
	{
		title: 'Avalie e ajude o próximo',
		text: 'Depois de concluir, dê de 1 a 5 estrelas. A reputação ajuda toda a comunidade.',
	},
];

export default function OnboardingPage() {
	const [step, setStep] = useState(0);
	const current = steps[step];
	const last = step === steps.length - 1;

	return (
		<div className="mx-auto w-full max-w-xl px-4 py-10">
			<div className="rounded-[2rem] border border-border bg-card p-6 text-center">
				<Dukinha className="mx-auto h-32 w-32" />
				<p className="mt-2 text-xs font-bold uppercase tracking-wide text-primary">
					Passo {step + 1} de {steps.length}
				</p>
				<h1 className="mt-2 font-display text-2xl font-extrabold">{current.title}</h1>
				<p className="mt-2 text-sm text-muted-foreground">{current.text}</p>

				<div className="mt-5 flex justify-center gap-2">
					{steps.map((s, i) => (
						<span
							key={s.title}
							className={cn(
								'h-2 rounded-full transition-all',
								i === step ? 'w-6 bg-primary' : 'w-2 bg-border',
							)}
						/>
					))}
				</div>

				<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
					{!last ? (
						<button
							type="button"
							onClick={() => setStep((s) => s + 1)}
							className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground"
						>
							Continuar <ArrowRight className="h-4 w-4" />
						</button>
					) : (
						<>
							<Link
								href="/novo"
								className="flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 font-bold text-primary-foreground"
							>
								Criar meu anúncio
							</Link>
							<Link
								href="/anuncios"
								className="flex min-h-[48px] items-center justify-center rounded-full border border-border px-6 font-semibold"
							>
								Ver anúncios
							</Link>
						</>
					)}
				</div>
			</div>

			<p className="mt-6 text-center text-sm text-muted-foreground">
				O que está parado com você pode fazer a diferença para outro estudante.
			</p>
		</div>
	);
}
