import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/server-user';
import { AdminSidebar } from '@/components/admin/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const admin = await isAdmin();
	if (!admin) redirect('/');

	return (
		<div className="flex min-h-[100dvh]">
			<AdminSidebar />
			<main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
		</div>
	);
}
