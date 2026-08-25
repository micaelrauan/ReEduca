import { NextResponse } from 'next/server';
import type { ZodTypeAny, z } from 'zod';

export function jsonError(message: string, status = 400) {
	return NextResponse.json({ error: message }, { status });
}

export async function parseBody<S extends ZodTypeAny>(
	req: Request,
	schema: S,
): Promise<
	{ data: z.output<S>; error?: never } | { data?: never; error: NextResponse }
> {
	let raw: unknown;
	try {
		raw = await req.json();
	} catch {
		return { error: jsonError('JSON inválido.', 400) };
	}
	const parsed = schema.safeParse(raw);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		return { error: jsonError(issue?.message || 'Dados inválidos.', 422) };
	}
	return { data: parsed.data as z.output<S> };
}

export function firstParam(value: string | string[] | undefined): string {
	return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}
