import type { Database } from './supabase-types';

export const CATEGORIES = [
	{ value: 'livros', label: 'Livros' },
	{ value: 'apostilas', label: 'Apostilas' },
	{ value: 'cadernos', label: 'Cadernos' },
	{ value: 'papelaria', label: 'Papelaria' },
	{ value: 'mochilas', label: 'Mochilas' },
	{ value: 'calculadoras', label: 'Calculadoras' },
	{ value: 'tecnicos', label: 'Materiais técnicos' },
	{ value: 'equipamentos', label: 'Equipamentos' },
] as const;

export const DEALS = [
	{ value: 'venda', label: 'Venda', className: 'bg-primary text-primary-foreground' },
	{ value: 'troca', label: 'Troca', className: 'bg-accent text-accent-foreground' },
	{ value: 'doacao', label: 'Doação', className: 'bg-secondary text-secondary-foreground' },
] as const;

export const CONDITIONS = [
	{ value: 'novo', label: 'Novo' },
	{ value: 'seminovo', label: 'Seminovo' },
	{ value: 'usado', label: 'Usado' },
	{ value: 'marcas_de_uso', label: 'Com marcas de uso' },
] as const;

export const STATUSES = [
	{ value: 'ativo', label: 'Ativo' },
	{ value: 'reservado', label: 'Reservado' },
	{ value: 'concluido', label: 'Concluído' },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]['value'];
export type DealValue = (typeof DEALS)[number]['value'];
export type ConditionValue = (typeof CONDITIONS)[number]['value'];
export type StatusValue = (typeof STATUSES)[number]['value'];

export function labelOf(
	list: ReadonlyArray<{ value: string; label: string }>,
	value: string | null | undefined,
): string {
	return list.find((i) => i.value === value)?.label || (value ?? '');
}

export function dealStyle(value: string): string {
	return DEALS.find((d) => d.value === value)?.className || 'bg-muted text-muted-foreground';
}

/* -------------------------------------------------------------------------- */
/*  Tipos de row do Supabase (snake_case)                                     */
/* -------------------------------------------------------------------------- */

export type UserRow = Database['public']['Tables']['users']['Row'];
export type ListingRow = Database['public']['Tables']['listings']['Row'];
export type RatingRow = Database['public']['Tables']['ratings']['Row'];

/** Row de listing com join de owner (select name). */
export type ListingWithOwnerName = ListingRow & { owner?: { name: string | null } | null };

/* -------------------------------------------------------------------------- */
/*  Serialização (row Supabase → formato client camelCase)                     */
/* -------------------------------------------------------------------------- */

/** Forma JSON-safe de um anúncio para consumo no client. */
export type SerializedListing = {
	id: string;
	title: string;
	description: string | null;
	category: CategoryValue;
	deal: DealValue;
	condition: ConditionValue;
	price: number | null;
	wanted: string | null;
	region: string | null;
	status: StatusValue;
	photoUrls: string[];
	sellerName: string | null;
	sellerRating: number | null;
	ownerId: string;
	ownerName: string | null;
	createdAt: string;
};

function photoUrlsOf(l: Pick<ListingRow, 'photo_urls'>): string[] {
	if (Array.isArray(l.photo_urls)) return l.photo_urls as string[];
	return [];
}

export function serializeListing(l: ListingWithOwnerName): SerializedListing {
	return {
		id: l.id,
		title: l.title,
		description: l.description,
		category: l.category as CategoryValue,
		deal: l.deal as DealValue,
		condition: l.condition as ConditionValue,
		price: l.price == null ? null : Number(l.price),
		wanted: l.wanted,
		region: l.region,
		status: l.status as StatusValue,
		photoUrls: photoUrlsOf(l),
		sellerName: l.seller_name,
		sellerRating: l.seller_rating == null ? null : Number(l.seller_rating),
		ownerId: l.owner_id,
		ownerName: l.owner?.name ?? null,
		createdAt: l.created_at,
	};
}

export function listingPhotos(listing: Pick<SerializedListing, 'photoUrls'>): string[] {
	return listing.photoUrls ?? [];
}

export function priceLabel(listing: SerializedListing): string {
	if (listing.deal === 'doacao') return 'Doação';
	if (listing.deal === 'troca')
		return listing.wanted ? `Troca por ${listing.wanted}` : 'Troca';
	if (!listing.price) return 'A combinar';
	return listing.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function sellerName(listing: SerializedListing): string {
	return listing.ownerName || listing.sellerName || 'Estudante ReEduca';
}

export function sellerRating(listing: SerializedListing): number {
	return listing.sellerRating ?? 0;
}
