import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { serializeListing, STATUSES } from '@/lib/reeduca';
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

	let user = await db.user.findUnique({ where: { id: userId } });
	if (!user && clerkUser) {
		user = await db.user.create({
			data: {
				id: userId,
				email:
					clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
						?.emailAddress ||
					clerkUser.emailAddresses[0]?.emailAddress ||
					`${userId}@placeholder.clerk`,
				name:
					[clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
				imageUrl: clerkUser.imageUrl || null,
			},
		});
	}

	const [myListings, ratings] = await Promise.all([
		db.listing.findMany({
			where: { ownerId: userId },
			orderBy: { createdAt: 'desc' as const },
			include: { owner: { select: { name: true } } },
		}),
		db.rating.findMany({
			where: { targetId: userId },
			orderBy: { createdAt: 'desc' as const },
			select: { id: true, stars: true, comment: true },
		}),
	]);

	const listingsByStatus: Record<string, ReturnType<typeof serializeListing>[]> = {};
	for (const s of STATUSES) listingsByStatus[s.value] = [];
	for (const l of myListings) {
		listingsByStatus[l.status].push(serializeListing(l));
	}

	const ratingAvg = ratings.length
		? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
		: 0;

	const data: ProfileData = {
		name: user?.name ?? null,
		email: clerkUser?.emailAddresses[0]?.emailAddress ?? user?.email ?? '',
		region: user?.region ?? null,
		bio: user?.bio ?? null,
		ratingsReceived: ratings,
		ratingAvg,
	};

	return <ProfileClient data={data} listingsByStatus={listingsByStatus} />;
}
