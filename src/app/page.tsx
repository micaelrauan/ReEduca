import Link from 'next/link';
import {
	ArrowRight,
	Backpack,
	BookOpen,
	Calculator,
	Compass,
	FileText,
	Laptop,
	Notebook,
	PenLine,
} from 'lucide-react';
import { Dukinha } from '@/components/Dukinha';
import { ListingsGrid } from '@/components/listing/ListingsGrid';
import { CATEGORIES, serializeListing } from '@/lib/reeduca';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const icons = {
	livros: BookOpen,
	apostilas: FileText,
	cadernos: Notebook,
	papelaria: PenLine,
	mochilas: Backpack,
	calculadoras: Calculator,
	tecnicos: Compass,
	equipamentos: Laptop,
};

const marqueeWords = [
	'livros parados',
	'apostilas do ano passado',
	'calculadora esquecida',
	'mochila boa demais pra ficar guardada',
	'canetas sobrando',
	'kit de desenho técnico',
];

export default async function HomePage() {
	let recent: ReturnType<typeof serializeListing>[] = [];
	try {
		const { data: rows } = await supabase
			.from('listings')
			.select('*, owner:users!owner_id(name)')
			.eq('status', 'ativo')
			.order('created_at', { ascending: false })
			.limit(8);
		recent = (rows ?? []).map(serializeListing);
	} catch (err) {
		console.error('home listings', err);
	}

	return (
		<>
			<section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-background to-background">
				<div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-16">
					<div className="space-y-5">
						<span className="inline-flex items-center gap-2 rounded-full bg-secondary/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-secondary-foreground">
							Feito por estudantes, para estudantes
						</span>
						<h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
							O que está parado com você pode{' '}
							<span className="marker-underline">fazer a diferença</span> para outro estudante.
						</h1>
						<p className="max-w-lg text-base text-muted-foreground">
							Venda, troque ou doe livros, apostilas, papelaria e equipamentos de estudo. Sem
							burocracia, direto com quem estuda perto de você.
						</p>

						<form action="/anuncios" method="get" className="flex gap-2">
							<div className="relative flex-1">
								<input
									name="q"
									placeholder="O que você procura?"
									className="w-full rounded-full border border-border bg-card py-3 pl-4 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>
							<button
								type="submit"
								className="min-h-[44px] rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
							>
								Buscar
							</button>
						</form>

						<div className="flex flex-wrap gap-3 text-sm">
							<Link
								href="/novo"
								className="min-h-[44px] rounded-full bg-foreground px-5 py-3 font-bold text-background transition-transform active:scale-[0.98]"
							>
								Anunciar material
							</Link>
							<Link
								href="/como-funciona"
								className="flex min-h-[44px] items-center gap-1 rounded-full border border-border px-5 py-3 font-semibold"
							>
								Como funciona <ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</div>

					<div className="relative mx-auto max-w-sm">
						<div className="absolute -left-6 top-6 h-24 w-24 rounded-full bg-secondary/50 blur-2xl" />
						<div className="relative rounded-[2rem] border border-border bg-card p-6 shadow-[0_30px_60px_-40px_hsl(165_40%_20%/0.9)]">
							<Dukinha className="mx-auto h-40 w-40" />
							<p className="mt-3 text-center font-display text-lg font-bold">
								Oi, eu sou o Dukinha!
							</p>
							<p className="mt-1 text-center text-sm text-muted-foreground">
								Te ajudo a dar um novo destino para o material que você não usa mais.
							</p>
						</div>
					</div>
				</div>

				<div className="overflow-hidden border-y border-border bg-primary py-2">
					<div className="animate-marquee flex w-max gap-8 pr-8 text-sm font-semibold uppercase tracking-wide text-primary-foreground">
						{[...marqueeWords, ...marqueeWords].map((word, i) => (
							<span key={`${word}-${i}`} className="whitespace-nowrap">
								{word} <span className="text-secondary">•</span>
							</span>
						))}
					</div>
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-4 py-8">
				<h2 className="font-display text-xl font-extrabold">Categorias em destaque</h2>
				<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
					{CATEGORIES.map((c) => {
						const Icon = icons[c.value] || BookOpen;
						return (
							<Link
								key={c.value}
								href={`/anuncios?categoria=${c.value}`}
								className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-transform hover:-translate-y-1 active:scale-[0.98]"
							>
								<Icon className="h-6 w-6 text-primary" strokeWidth={1.9} />
								<span className="font-display text-sm font-bold">{c.label}</span>
							</Link>
						);
					})}
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-4 pb-12">
				<div className="flex items-end justify-between gap-3">
					<h2 className="font-display text-xl font-extrabold">Anúncios recentes</h2>
					<Link href="/anuncios" className="text-sm font-semibold text-primary">
						Ver todos
					</Link>
				</div>

				{recent.length === 0 ? (
					<div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
						<Dukinha className="h-24 w-24" />
						<p className="font-display text-lg font-bold">Ainda não tem nada aqui</p>
						<p className="text-sm text-muted-foreground">
							O Dukinha está esperando o primeiro anúncio. Que tal ser você?
						</p>
						<Link
							href="/novo"
							className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
						>
							Criar anúncio
						</Link>
					</div>
				) : (
					<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<ListingsGrid withReveal listings={recent} />
					</div>
				)}
			</section>
		</>
	);
}
