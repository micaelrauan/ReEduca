import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
	'/novo(.*)',
	'/perfil(.*)',
	'/favoritos(.*)',
	'/chat(.*)',
	'/anuncio/(.*)/editar',
]);

export default clerkMiddleware(async (auth, req) => {
	if (isProtectedRoute(req)) {
		await auth.protect();
	}
	return NextResponse.next();
});

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.[^?]*$|api/webhooks).*)',
	],
};
