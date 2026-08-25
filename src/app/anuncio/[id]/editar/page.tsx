import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { serializeListing } from '@/lib/reeduca';
import { ListingForm } from '@/components/listing/ListingForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Editar anúncio' };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: PageProps) {
	const { id } = await params;
	const { userId } = await auth();
	if (!userId) redirect('/sign-in');

	const listing = await db.listing.findUnique({
		where: { id },
		include: { owner: { select: { name: true } } },
	});
	if (!listing) notFound();
	if (listing.ownerId !== userId) redirect(`/anuncio/${id}`);

	return <ListingForm mode="edit" listingId={id} initial={serializeListing(listing)} />;
}
