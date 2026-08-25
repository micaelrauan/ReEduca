import { SignIn } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Entrar' };

export default function SignInPage() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
			<SignIn />
		</div>
	);
}
