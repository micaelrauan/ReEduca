import { z } from 'zod';

const categoryValues = [
	'livros',
	'apostilas',
	'cadernos',
	'papelaria',
	'mochilas',
	'calculadoras',
	'tecnicos',
	'equipamentos',
] as const;
const dealValues = ['venda', 'troca', 'doacao'] as const;
const conditionValues = ['novo', 'seminovo', 'usado', 'marcas_de_uso'] as const;
const statusValues = ['ativo', 'reservado', 'concluido'] as const;

export const categorySchema = z.enum(categoryValues);
export const dealSchema = z.enum(dealValues);
export const conditionSchema = z.enum(conditionValues);
export const statusSchema = z.enum(statusValues);

export const listingBaseSchema = z.object({
	title: z.string().trim().min(1, 'Título obrigatório').max(120),
	description: z.string().trim().max(2000).optional().default(''),
	category: categorySchema,
	deal: dealSchema,
	condition: conditionSchema,
	price: z.number().nonnegative().max(99999999).nullable().optional(),
	wanted: z.string().trim().max(200).optional().default(''),
	region: z.string().trim().max(120).optional().default(''),
	status: statusSchema.optional(),
	photoUrls: z.array(z.string().url('URL inválida')).max(5).optional().default([]),
});

type ListingBase = z.output<typeof listingBaseSchema>;

function requirePriceForSale(data: ListingBase, ctx: z.RefinementCtx) {
	if (data.deal === 'venda' && data.price != null && data.price <= 0) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['price'],
			message: 'Informe um preço maior que zero para venda.',
		});
	}
}

export const listingCreateSchema = listingBaseSchema.superRefine(requirePriceForSale);

export const listingUpdateSchema = listingBaseSchema.partial();

export const favoriteActionSchema = z.object({
	listingId: z.string().min(1),
});

export const messageSendSchema = z.object({
	recipientId: z.string().min(1),
	listingId: z.string().min(1),
	text: z.string().trim().min(1, 'Mensagem vazia').max(1000),
});

export const ratingCreateSchema = z.object({
	targetId: z.string().min(1),
	listingId: z.string().min(1),
	stars: z.number().int().min(1).max(5),
	comment: z.string().trim().max(500).optional().default(''),
});

export const reportCreateSchema = z.object({
	reason: z.string().trim().min(1, 'Conte o que está errado').max(500),
	kind: z.enum(['anuncio', 'usuario']),
	listingId: z.string().min(1),
});

export const profileUpdateSchema = z.object({
	name: z.string().trim().max(120).optional(),
	region: z.string().trim().max(120).optional(),
	bio: z.string().trim().max(500).optional(),
});
