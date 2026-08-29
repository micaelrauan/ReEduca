'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Dukinha } from '@/components/Dukinha';
import { StarRating } from '@/components/StarRating';
import { ListingCard } from '@/components/ListingCard';
import { STATUSES, type SerializedListing } from '@/lib/reeduca';
import { cn } from '@/lib/utils';

export type ProfileData = {
	name: string | null;
	email: string;
	region: string | null;
	bio: string | null;
	ratingsReceived: { id: string; stars: number; comment: string | null }[];
	ratingAvg: number;
};

type ProfileClientProps = {
	data: ProfileData;
	listingsByStatus: Record<string, SerializedListing[]>;
};

export function ProfileClient({ data, listingsByStatus }: ProfileClientProps) {
	const router = useRouter();
	const [tab, setTab] = useState<string>('ativo');
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState({ name: data.name ?? '', region: data.region ?? '', bio: data.bio ?? '' });
	const [saving, setSaving] = useState(false);

	const saveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			await fetch('/api/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: form.name, region: form.region, bio: form.bio }),
			});
			setEditing(false);
			router.refresh();
		} finally {
			setSaving(false);
		}
	};

	const filtered = listingsByStatus[tab] ?? [];

	return (
		<div className="mx-auto w-full max-w-5xl px-4 py-6">
			<div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
				<Dukinha className="h-16 w-16" />
				<div className="flex-1">
					{editing ? (
						<form onSubmit={saveProfile} className="space-y-2">
							<input
								className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								placeholder="Seu nome"
							/>
							<input
								className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
								value={form.region}
								onChange={(e) => setForm({ ...form, region: e.target.value })}
								placeholder="Cidade - bairro"
							/>
							<textarea
								className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
								value={form.bio}
								onChange={(e) => setForm({ ...form, bio: e.target.value })}
								placeholder="Fale um pouco sobre você"
								rows={3}
							/>
							<button
								type="submit"
								disabled={saving}
								className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
							>
								{saving ? 'Salvando...' : 'Salvar'}
							</button>
						</form>
					) : (
						<>
							<h1 className="font-display text-xl font-extrabold">
								{data.name || 'Estudante ReEduca'}
							</h1>
							<p className="text-sm text-muted-foreground">{data.email}</p>
							<p className="text-sm text-muted-foreground">
								{data.region || 'Região não informada'}
							</p>
							{data.bio && (
								<p className="mt-2 text-sm text-foreground/80">{data.bio}</p>
							)}
							<div className="mt-1 flex items-center gap-2">
								<StarRating value={data.ratingAvg} />
								<span className="text-xs text-muted-foreground">
									{data.ratingsReceived.length
										? `${data.ratingAvg.toFixed(1)} (${data.ratingsReceived.length} avaliações)`
										: 'Sem avaliações ainda'}
								</span>
							</div>
						</>
					)}
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setEditing((v) => !v)}
						className="flex min-h-[44px] items-center gap-1 rounded-full border border-border px-4 text-sm font-semibold"
					>
						<Pencil className="h-4 w-4" /> Editar
					</button>
				</div>
			</div>

			<div className="mt-6 flex items-center justify-between gap-3">
				<h2 className="font-display text-lg font-extrabold">Meus anúncios</h2>
				<Link
					href="/novo"
					className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
				>
					Novo anúncio
				</Link>
			</div>

			<div className="mt-3 flex gap-2 overflow-x-auto">
				{STATUSES.map((s) => (
					<button
						key={s.value}
						type="button"
						onClick={() => setTab(s.value)}
						className={cn(
							'min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-semibold',
							tab === s.value
								? 'border-transparent bg-foreground text-background'
								: 'border-border text-muted-foreground',
						)}
					>
						{s.label}
					</button>
				))}
			</div>

			{filtered.length === 0 ? (
				<div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center">
					<Dukinha className="h-20 w-20" />
					<p className="text-sm text-muted-foreground">
						Nenhum anúncio nesta aba por enquanto.
					</p>
				</div>
			) : (
				<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filtered.map((l) => (
						<div key={l.id} className="space-y-2">
							<ListingCard listing={l} />
							<Link
								href={`/anuncio/${l.id}/editar`}
								className="block rounded-full border border-border py-2 text-center text-sm font-semibold"
							>
								Editar anúncio
							</Link>
						</div>
					))}
				</div>
			)}

			<h2 className="mt-8 font-display text-lg font-extrabold">Avaliações recebidas</h2>
			{data.ratingsReceived.length === 0 ? (
				<p className="mt-2 text-sm text-muted-foreground">
					Assim que concluir uma negociação, as avaliações aparecem aqui.
				</p>
			) : (
				<ul className="mt-3 space-y-3">
					{data.ratingsReceived.map((r) => (
						<li key={r.id} className="rounded-2xl border border-border bg-card p-4">
							<StarRating value={r.stars} />
							<p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
