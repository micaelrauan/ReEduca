import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ListingForm } from '@/components/listing/ListingForm';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Criar anúncio',
	description:
		'Publique seu material escolar no ReEduca em poucos passos: fotos, estado de conservação e tipo de negociação.',
};

export default async function NewListingPage() {
	const { userId } = await auth();
	if (!userId) redirect('/sign-in');

	return <ListingForm mode="create" />;
}
