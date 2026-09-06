import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/server-user';

export async function GET() {
	const admin = await isAdmin();
	return NextResponse.json({ admin });
}
