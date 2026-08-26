import { supabase } from '@/lib/supabase';
import { serializeListing, type SerializedListing } from '@/lib/reeduca';
import { CATEGORIES, CONDITIONS, DEALS, STATUSES } from '@/lib/reeduca';

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

	let query = supabase
		.from('listings')
		.select('*, owner:users!owner_id(name)')
		.limit(Math.min(Math.max(take, 1), 200));

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

	const { data, error } = await query;
	if (error) throw error;

	return { items: (data ?? []).map(serializeListing) };
}
