import { SignUp } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Criar conta' };

export default function SignUpPage() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
			<SignUp />
		</div>
	);
}
