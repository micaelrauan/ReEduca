import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function getAuthUserId(): Promise<string | null> {
	const { userId } = await auth();
	return userId;
}

/** Garante que o usuário autenticado exista espelhado na tabela User e devolve o id. */
export async function ensureMirroredUser(): Promise<string | null> {
	const userId = await getAuthUserId();
	if (!userId) return null;

	const existing = await db.user.findUnique({ where: { id: userId } });
	if (existing) return userId;

	const clerkUser = await currentUser();
	await db.user.create({
		data: {
			id: userId,
			email:
				clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
					?.emailAddress ||
				clerkUser?.emailAddresses[0]?.emailAddress ||
				`${userId}@placeholder.clerk`,
			name: clerkUser
				? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null
				: null,
			imageUrl: clerkUser?.imageUrl ?? null,
		},
	});
	return userId;
}
