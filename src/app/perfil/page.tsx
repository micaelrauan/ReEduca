import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { serializeListing, STATUSES, type ListingWithOwnerName } from '@/lib/reeduca';
import { ProfileClient, type ProfileData } from '@/components/profile/ProfileClient';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Meu perfil',
	description:
		'Gerencie seus dados, avaliações recebidas e seus anúncios ativos, reservados e concluídos no ReEduca.',
};

export default async function ProfilePage() {
	const { userId } = await auth();
	if (!userId) redirect('/sign-in');

	const clerkUser = await currentUser();

	let { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
	if (!user && clerkUser) {
		const { data: newUser } = await supabase
			.from('users')
			.insert({
				id: userId,
				email:
					clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
						?.emailAddress ||
					clerkUser.emailAddresses[0]?.emailAddress ||
					`${userId}@placeholder.clerk`,
				name:
					[clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
				image_url: clerkUser.imageUrl || null,
			})
			.select()
			.single();
		user = newUser;
	}

	const [{ data: myListings }, { data: ratings }] = await Promise.all([
		supabase
			.from('listings')
			.select('*, owner:users!owner_id(name)')
			.eq('owner_id', userId)
			.order('created_at', { ascending: false }),
		supabase
			.from('ratings')
			.select('id, stars, comment')
			.eq('target_id', userId)
			.order('created_at', { ascending: false }),
	]);

	const listingsByStatus: Record<string, ReturnType<typeof serializeListing>[]> = {};
	for (const s of STATUSES) listingsByStatus[s.value] = [];
	for (const l of myListings ?? []) {
		listingsByStatus[l.status].push(serializeListing(l as ListingWithOwnerName));
	}

	const ratingAvg = ratings && ratings.length
		? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
		: 0;

	const data: ProfileData = {
		name: user?.name ?? null,
		email: clerkUser?.emailAddresses[0]?.emailAddress ?? user?.email ?? '',
		region: user?.region ?? null,
		bio: user?.bio ?? null,
		ratingsReceived: ratings ?? [],
		ratingAvg,
	};

	return <ProfileClient data={data} listingsByStatus={listingsByStatus} />;
}
