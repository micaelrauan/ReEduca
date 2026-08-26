import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function getAuthUserId(): Promise<string | null> {
	const { userId } = await auth();
	return userId;
}

/** Garante que o usuário autenticado exista espelhado na tabela User e devolve o id. */
export async function ensureMirroredUser(): Promise<string | null> {
	const userId = await getAuthUserId();
	if (!userId) return null;

	const { data: existing } = await supabase
		.from('users')
		.select('id')
		.eq('id', userId)
		.single();
	if (existing) return userId;

	const clerkUser = await currentUser();
	const email =
		clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
			?.emailAddress ||
		clerkUser?.emailAddresses[0]?.emailAddress ||
		`${userId}@placeholder.clerk`;
	const name = clerkUser
		? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null
		: null;

	await supabase.from('users').insert({
		id: userId,
		email,
		name,
		image_url: clerkUser?.imageUrl ?? null,
	});

	return userId;
}
