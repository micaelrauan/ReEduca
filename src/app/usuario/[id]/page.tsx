import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StarRating } from '@/components/StarRating';
import { ListingsGrid } from '@/components/listing/ListingsGrid';
import { serializeListing, type ListingWithOwnerName } from '@/lib/reeduca';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function PublicProfilePage({ params }: PageProps) {
	const { id } = await params;

	const { data: user } = await supabase
		.from('users')
		.select('id, name, image_url, region, bio, created_at')
		.eq('id', id)
		.single();

	if (!user) notFound();

	const [{ data: ratings }, { data: listings }] = await Promise.all([
		supabase
			.from('ratings')
			.select('id, stars, comment, created_at, author:users!author_id(name)')
			.eq('target_id', id)
			.order('created_at', { ascending: false })
			.limit(20),
		supabase
			.from('listings')
			.select('*, owner:users!owner_id(name)')
			.eq('owner_id', id)
			.eq('status', 'ativo')
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
			.limit(12),
	]);

	const avg =
		ratings && ratings.length
			? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
			: 0;

	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-6">
			<div className="flex items-center gap-4">
				{user.image_url ? (
					<img
						src={user.image_url}
						alt={user.name || 'Estudante'}
						className="h-16 w-16 rounded-full object-cover"
					/>
				) : (
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-bold text-muted-foreground">
						{(user.name || '?')[0]?.toUpperCase()}
					</div>
				)}
				<div>
					<h1 className="font-display text-xl font-extrabold">{user.name || 'Estudante'}</h1>
					{user.region && (
						<div className="flex items-center gap-1 text-sm text-muted-foreground">
							<MapPin className="h-3.5 w-3.5" /> {user.region}
						</div>
					)}
					<div className="mt-1 flex items-center gap-2">
						<StarRating value={avg} size="h-4 w-4" />
						<span className="text-xs text-muted-foreground">
							{avg ? avg.toFixed(1) : 'Sem avaliações'}
							{ratings?.length ? ` (${ratings.length})` : ''}
						</span>
					</div>
				</div>
			</div>

			{user.bio && (
				<p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
					{user.bio}
				</p>
			)}

			{(ratings?.length ?? 0) > 0 && (
				<section className="mt-6">
					<h2 className="font-display text-lg font-bold">Avaliações recebidas</h2>
					<div className="mt-3 space-y-3">
						{ratings!.map((r) => (
							<div
								key={r.id}
								className="rounded-2xl border border-border bg-card p-3"
							>
								<div className="flex items-center gap-2">
									<StarRating value={r.stars} size="h-3 w-3" />
									<span className="text-xs font-bold text-muted-foreground">
										{(r.author as { name: string | null } | null)?.name || 'Anônimo'}
									</span>
									<span className="text-xs text-muted-foreground/60">
										{new Date(r.created_at).toLocaleDateString('pt-BR')}
									</span>
								</div>
								{r.comment && (
									<p className="mt-1 text-sm text-foreground/80">{r.comment}</p>
								)}
							</div>
						))}
					</div>
				</section>
			)}

			{(listings?.length ?? 0) > 0 && (
				<section className="mt-8">
					<h2 className="font-display text-lg font-bold">Anúncios ativos</h2>
					<div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<ListingsGrid
							listings={(listings as ListingWithOwnerName[]).map(serializeListing)}
						/>
					</div>
				</section>
			)}
		</div>
	);
}
