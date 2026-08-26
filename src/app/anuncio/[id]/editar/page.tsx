import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { serializeListing, type ListingWithOwnerName } from '@/lib/reeduca';
import { ListingForm } from '@/components/listing/ListingForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Editar anúncio' };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: PageProps) {
	const { id } = await params;
	const { userId } = await auth();
	if (!userId) redirect('/sign-in');

	const { data } = await supabase
		.from('listings')
		.select('*, owner:users!owner_id(name)')
		.eq('id', id)
		.single();
	const listing = data as ListingWithOwnerName | null;
	if (!listing) notFound();
	if (listing.owner_id !== userId) redirect(`/anuncio/${id}`);

	return <ListingForm mode="edit" listingId={id} initial={serializeListing(listing)} />;
}
