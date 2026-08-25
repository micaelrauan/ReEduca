import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { serializeListing, type SerializedListing } from '@/lib/reeduca';
import {
	CATEGORIES,
	CONDITIONS,
	DEALS,
	STATUSES,
	type CategoryValue,
	type ConditionValue,
	type DealValue,
	type StatusValue,
} from '@/lib/reeduca';

export type RawSearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
	return (Array.isArray(value) ? value[0] : value)?.trim() || '';
}

export async function searchListings(
	sp: RawSearchParams,
	take = 200,
): Promise<{ items: SerializedListing[] }> {
	const q = one(sp.q);
	const categoria = one(sp.categoria);
	const tipo = one(sp.tipo);
	const condicao = one(sp.condicao);
	const status = one(sp.status);
	const regiao = one(sp.regiao);
	const precoMax = Number(one(sp.precoMax)) || 0;
	const ordenar = one(sp.ordenar) || 'recentes';

	const where = {} as Prisma.ListingWhereInput;
	if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
	if ((CATEGORIES.map((c) => c.value) as readonly string[]).includes(categoria))
		where.category = categoria as CategoryValue;
	if ((DEALS.map((d) => d.value) as readonly string[]).includes(tipo))
		where.deal = tipo as DealValue;
	if ((CONDITIONS.map((c) => c.value) as readonly string[]).includes(condicao))
		where.condition = condicao as ConditionValue;
	if ((STATUSES.map((s) => s.value) as readonly string[]).includes(status))
		where.status = status as StatusValue;
	if (regiao) where.region = { contains: regiao };
	if (precoMax > 0) where.OR = [...(where.OR ?? []), { price: { lte: precoMax } }, { price: null }];

	let orderBy: Prisma.ListingOrderByWithRelationInput[] = [{ createdAt: 'desc' }];
	if (ordenar === 'menor') orderBy = [{ price: { sort: 'asc', nulls: 'last' } }];
	if (ordenar === 'maior') orderBy = [{ price: { sort: 'desc', nulls: 'last' } }];
	if (ordenar === 'avaliacao') orderBy = [{ sellerRating: { sort: 'desc', nulls: 'last' } }];

	const rows = await db.listing.findMany({
		where,
		orderBy,
		take: Math.min(Math.max(take, 1), 200),
		include: { owner: { select: { name: true } } },
	});

	return { items: rows.map(serializeListing) };
}
