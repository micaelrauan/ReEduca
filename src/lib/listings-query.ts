import { supabase } from '@/lib/supabase';
import { serializeListing, type SerializedListing } from '@/lib/reeduca';
import { CATEGORIES, CONDITIONS, DEALS, STATUSES } from '@/lib/reeduca';

export type RawSearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
	return (Array.isArray(value) ? value[0] : value)?.trim() || '';
}

export const PAGE_SIZE = 24;

export type PaginatedResult = {
	items: SerializedListing[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export async function searchListings(
	sp: RawSearchParams,
): Promise<PaginatedResult> {
	const q = one(sp.q);
	const categoria = one(sp.categoria);
	const tipo = one(sp.tipo);
	const condicao = one(sp.condicao);
	const status = one(sp.status);
	const regiao = one(sp.regiao);
	const precoMax = Number(one(sp.precoMax)) || 0;
	const ordenar = one(sp.ordenar) || 'recentes';
	const page = Math.max(1, Number(one(sp.page)) || 1);
	const pageSize = PAGE_SIZE;

	let query = supabase
		.from('listings')
		.select('*, owner:users!owner_id(name)', { count: 'exact' })
		.is('deleted_at', null);

	// Filtros
	if (q) {
		query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
	}
	if ((CATEGORIES.map((c) => c.value) as readonly string[]).includes(categoria)) {
		query = query.eq('category', categoria);
	}
	if ((DEALS.map((d) => d.value) as readonly string[]).includes(tipo)) {
		query = query.eq('deal', tipo);
	}
	if ((CONDITIONS.map((c) => c.value) as readonly string[]).includes(condicao)) {
		query = query.eq('condition', condicao);
	}
	if ((STATUSES.map((s) => s.value) as readonly string[]).includes(status)) {
		query = query.eq('status', status);
	}
	if (regiao) {
		query = query.ilike('region', `%${regiao}%`);
	}
	if (precoMax > 0) {
		query = query.or(`price.lte.${precoMax},price.is.null`);
	}

	// Ordenação
	if (ordenar === 'menor') {
		query = query.order('price', { ascending: true, nullsFirst: false });
	} else if (ordenar === 'maior') {
		query = query.order('price', { ascending: false, nullsFirst: false });
	} else if (ordenar === 'avaliacao') {
		query = query.order('seller_rating', { ascending: false, nullsFirst: false });
	} else {
		query = query.order('created_at', { ascending: false });
	}

	// Paginação
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;
	query = query.range(from, to);

	const { data, error, count } = await query;
	if (error) throw error;

	const total = count ?? 0;
	const totalPages = Math.ceil(total / pageSize);

	return {
		items: (data ?? []).map(serializeListing),
		total,
		page,
		pageSize,
		totalPages,
	};
}
