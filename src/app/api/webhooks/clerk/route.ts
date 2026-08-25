import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { db } from '@/lib/db';

type ClerkEmail = { id: string; emailAddress: string };

type ClerkUserPayload = {
	id: string;
	email_addresses?: ClerkEmail[];
	primary_email_address_id?: string;
	first_name?: string | null;
	last_name?: string | null;
	image_url?: string | null;
};

type ClerkEvent = {
	type: string;
	data: ClerkUserPayload;
};

function primaryEmail(data: ClerkUserPayload): string | null {
	return (
		data.email_addresses?.find((e) => e.id === data.primary_email_address_id)?.emailAddress ||
		data.email_addresses?.[0]?.emailAddress ||
		null
	);
}

export async function POST(req: Request) {
	const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
	if (!CLERK_WEBHOOK_SECRET) {
		console.error('CLERK_WEBHOOK_SECRET não configurado.');
		return jsonErrorInternal();
	}

	const h = await headers();
	const svixHeaders = {
		'svix-id': h.get('svix-id') ?? '',
		'svix-timestamp': h.get('svix-timestamp') ?? '',
		'svix-signature': h.get('svix-signature') ?? '',
	};

	let event: ClerkEvent;
	try {
		const payload = JSON.stringify(await req.json());
		const wh = new Webhook(CLERK_WEBHOOK_SECRET);
		event = wh.verify(payload, svixHeaders) as unknown as ClerkEvent;
	} catch (err) {
		console.error('Webhook Clerk: assinatura inválida', err);
		return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
	}

	try {
		switch (event.type) {
			case 'user.created':
			case 'user.updated': {
				const email = primaryEmail(event.data);
				if (!email) break;
				await db.user.upsert({
					where: { id: event.data.id },
					update: {
						email,
						name:
							[event.data.first_name, event.data.last_name].filter(Boolean).join(' ') ||
							null,
						imageUrl: event.data.image_url ?? null,
					},
					create: {
						id: event.data.id,
						email,
						name:
							[event.data.first_name, event.data.last_name].filter(Boolean).join(' ') ||
							null,
						imageUrl: event.data.image_url ?? null,
					},
				});
				break;
			}
			case 'user.deleted': {
				if (event.data.id) {
					await db.user.deleteMany({ where: { id: event.data.id } });
				}
				break;
			}
		}
		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error('Webhook Clerk: falha ao sincronizar usuário', err);
		return jsonErrorInternal();
	}
}

function jsonErrorInternal() {
	return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
}
