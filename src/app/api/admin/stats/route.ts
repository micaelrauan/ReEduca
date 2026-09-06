import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/server-user';

export async function GET() {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

	const [totalUsers, usersToday, users7d, users30d, activeListings, pendingReports, totalMessages, topCategories, topRegions] =
		await Promise.all([
			supabase.from('users').select('id', { count: 'exact', head: true }),
			supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', today),
			supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
			supabase.from('users').select('id,created_at', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
			supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
			supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
			supabase.from('messages').select('id', { count: 'exact', head: true }),
			supabase.from('listings').select('category').eq('status', 'ativo'),
			supabase.from('listings').select('region').eq('status', 'ativo').not('region', 'is', null),
		]);

	// Contar categorias
	const catCounts: Record<string, number> = {};
	if (topCategories.data) {
		for (const row of topCategories.data) {
			catCounts[row.category] = (catCounts[row.category] || 0) + 1;
		}
	}
	const top5Categories = Object.entries(catCounts)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5)
		.map(([name, count]) => ({ name, count }));

	// Contar regiões
	const regCounts: Record<string, number> = {};
	if (topRegions.data) {
		for (const row of topRegions.data) {
			if (row.region) regCounts[row.region] = (regCounts[row.region] || 0) + 1;
		}
	}
	const top5Regions = Object.entries(regCounts)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5)
		.map(([name, count]) => ({ name, count }));

	// Gráfico: usuários por dia (últimos 30 dias)
	const dailyData: { date: string; users: number }[] = [];
	for (let i = 29; i >= 0; i--) {
		const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
		const dayStr = d.toISOString().slice(0, 10);
		dailyData.push({ date: dayStr, users: 0 });
	}

	if (users30d.data) {
		for (const u of users30d.data) {
			const day = u.created_at.slice(0, 10);
			const entry = dailyData.find((e) => e.date === day);
			if (entry) entry.users++;
		}
	}

	return NextResponse.json({
		totalUsers: totalUsers.count ?? 0,
		usersToday: usersToday.count ?? 0,
		users7d: users7d.count ?? 0,
		users30d: users30d.count ?? 0,
		activeListings: activeListings.count ?? 0,
		pendingReports: pendingReports.count ?? 0,
		totalMessages: totalMessages.count ?? 0,
		top5Categories,
		top5Regions,
		dailyData,
	});
}
