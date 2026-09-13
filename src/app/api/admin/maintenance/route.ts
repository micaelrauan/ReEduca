import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin, getAuthUserId } from '@/lib/server-user';

type MaintenanceAction =
	| 'export_users'
	| 'export_listings'
	| 'export_reports'
	| 'export_messages'
	| 'health_report'
	| 'ban_all_users'
	| 'delete_banned_users'
	| 'hide_all_listings'
	| 'restore_all_listings'
	| 'delete_inactive_listings'
	| 'delete_all_listings'
	| 'unfeature_all'
	| 'dismiss_all_reports'
	| 'delete_all_reports'
	| 'delete_all_messages'
	| 'delete_messages_older_than'
	| 'delete_favorites'
	| 'delete_all_ratings'
	| 'reset_fav_counts'
	| 'purge_soft_deleted'
	| 'clear_admin_log';

const DESTRUCTIVE_ACTIONS = new Set<MaintenanceAction>([
	'delete_banned_users',
	'delete_inactive_listings',
	'delete_all_listings',
	'delete_all_reports',
	'delete_all_messages',
	'delete_messages_older_than',
	'delete_favorites',
	'delete_all_ratings',
	'purge_soft_deleted',
	'clear_admin_log',
]);

const DANGEROUS_ACTIONS = new Set<MaintenanceAction>([
	'ban_all_users',
	'delete_banned_users',
	'delete_all_listings',
	'delete_all_reports',
	'delete_all_messages',
	'purge_soft_deleted',
]);

async function logAdminAction(adminId: string, action: string, note: string | null) {
	await supabase.from('admin_actions').insert({
		admin_id: adminId,
		action: `maintenance_${action}`,
		target_type: 'system',
		target_id: 'bulk',
		note,
	});
}

async function exportUsers() {
	const { data, error } = await supabase
		.from('users')
		.select('id, email, name, region, role, banned_at, created_at')
		.order('created_at', { ascending: false });
	if (error) throw error;
	return { count: data.length, data };
}

async function exportListings() {
	const { data, error } = await supabase
		.from('listings')
		.select('id, title, category, status, price, region, featured, owner_id, created_at, deleted_at')
		.order('created_at', { ascending: false });
	if (error) throw error;
	return { count: data.length, data };
}

async function exportReports() {
	const { data, error } = await supabase
		.from('reports')
		.select('id, reason, kind, status, reporter_id, listing_id, created_at')
		.order('created_at', { ascending: false });
	if (error) throw error;
	return { count: data.length, data };
}

async function exportMessages() {
	const { data, error } = await supabase
		.from('messages')
		.select('id, text, sender_id, recipient_id, listing_id, read_at, created_at')
		.order('created_at', { ascending: false });
	if (error) throw error;
	return { count: data.length, data };
}

async function healthReport() {
	const counts = await Promise.all([
		supabase.from('users').select('id', { count: 'exact', head: true }),
		supabase.from('listings').select('id', { count: 'exact', head: true }),
		supabase.from('messages').select('id', { count: 'exact', head: true }),
		supabase.from('reports').select('id', { count: 'exact', head: true }),
		supabase.from('favorites').select('owner_id', { count: 'exact', head: true }),
		supabase.from('ratings').select('id', { count: 'exact', head: true }),
		supabase.from('admin_actions').select('id', { count: 'exact', head: true }),
	]);

	const banned = await supabase
		.from('users')
		.select('id', { count: 'exact', head: true })
		.not('banned_at', 'is', null);

	const inactiveListings = await supabase
		.from('listings')
		.select('id', { count: 'exact', head: true })
		.eq('status', 'inativo');

	const softDeleted = await supabase
		.from('listings')
		.select('id', { count: 'exact', head: true })
		.not('deleted_at', 'is', null);

	const pendingReports = await supabase
		.from('reports')
		.select('id', { count: 'exact', head: true })
		.eq('status', 'pendente');

	return {
		tables: {
			users: counts[0].count ?? 0,
			listings: counts[1].count ?? 0,
			messages: counts[2].count ?? 0,
			reports: counts[3].count ?? 0,
			favorites: counts[4].count ?? 0,
			ratings: counts[5].count ?? 0,
			admin_actions: counts[6].count ?? 0,
		},
		suspicious: {
			banned_users: banned.count ?? 0,
			inactive_listings: inactiveListings.count ?? 0,
			soft_deleted_listings: softDeleted.count ?? 0,
			pending_reports: pendingReports.count ?? 0,
		},
	};
}

async function banAllUsers() {
	const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
	const adminIds = (admins ?? []).map((a) => a.id);

	let query = supabase
		.from('users')
		.update({ banned_at: new Date().toISOString(), ban_reason: 'Ação administrativa em lote' })
		.is('banned_at', null)
		.neq('role', 'admin');

	if (adminIds.length > 0) {
		query = query.not('id', 'in', `(${adminIds.join(',')})`);
	}

	const { count, error } = await query;
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function deleteBannedUsers() {
	const { data: banned } = await supabase
		.from('users')
		.select('id')
		.not('banned_at', 'is', null)
		.neq('role', 'admin');

	if (!banned || banned.length === 0) return { affected: 0 };

	const ids = banned.map((u) => u.id);
	const idsStr = `(${ids.join(',')})`;

	await supabase.from('favorites').delete().in('owner_id', ids);
	await supabase.from('ratings').delete().or(`author_id.in.${idsStr},target_id.in.${idsStr}`);
	await supabase.from('messages').delete().or(`sender_id.in.${idsStr},recipient_id.in.${idsStr}`);
	await supabase.from('reports').delete().in('reporter_id', ids);
	await supabase.from('listings').delete().in('owner_id', ids);
	const { count, error } = await supabase.from('users').delete().in('id', ids);
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function hideAllListings() {
	const { count, error } = await supabase
		.from('listings')
		.update({ status: 'inativo' })
		.eq('status', 'disponivel')
		.is('deleted_at', null);
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function restoreAllListings() {
	const { count, error } = await supabase
		.from('listings')
		.update({ status: 'disponivel' })
		.eq('status', 'inativo')
		.is('deleted_at', null);
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function deleteInactiveListings() {
	const { count, error } = await supabase
		.from('listings')
		.delete()
		.eq('status', 'inativo');
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function deleteAllListings() {
	const { count, error } = await supabase
		.from('listings')
		.delete()
		.is('deleted_at', null);
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function unfeatureAll() {
	const { count, error } = await supabase
		.from('listings')
		.update({ featured: false })
		.eq('featured', true);
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function dismissAllReports() {
	const { count, error } = await supabase
		.from('reports')
		.update({ status: 'dispensado', reviewed_at: new Date().toISOString() })
		.eq('status', 'pendente');
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function deleteAllReports() {
	const { count, error } = await supabase.from('reports').delete().gt('created_at', '1970-01-01');
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function deleteAllMessages() {
	const { count, error } = await supabase.from('messages').delete().gt('created_at', '1970-01-01');
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function deleteMessagesOlderThan(days: number) {
	const cutoff = new Date(Date.now() - days * 86400000).toISOString();
	const { count, error } = await supabase.from('messages').delete().lt('created_at', cutoff);
	if (error) throw error;
	return { affected: count ?? 0, cutoff };
}

async function deleteFavorites() {
	const { count, error } = await supabase.from('favorites').delete().gt('created_at', '1970-01-01');
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function deleteAllRatings() {
	const { count, error } = await supabase.from('ratings').delete().gt('created_at', '1970-01-01');
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function resetFavCounts() {
	const { count, error } = await supabase
		.from('listings')
		.update({ fav_count: 0 })
		.gt('fav_count', 0);
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function purgeSoftDeleted() {
	const { count, error } = await supabase
		.from('listings')
		.delete()
		.not('deleted_at', 'is', null);
	if (error) throw error;
	return { affected: count ?? 0 };
}

async function clearAdminLog() {
	const { count, error } = await supabase.from('admin_actions').delete().gt('created_at', '1970-01-01');
	if (error) throw error;
	return { affected: count ?? 0 };
}

export async function POST(request: NextRequest) {
	const admin = await isAdmin();
	if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const { action, params } = body as { action: MaintenanceAction; params?: Record<string, unknown> };

	if (!action) {
		return NextResponse.json({ error: 'Missing action' }, { status: 400 });
	}

	if (DESTRUCTIVE_ACTIONS.has(action) && body.confirm !== true) {
		return NextResponse.json(
			{ error: 'Destructive action requires confirm: true' },
			{ status: 400 },
		);
	}

	const userId = await getAuthUserId();
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	try {
		let result: unknown;

		switch (action) {
			case 'export_users':
				result = await exportUsers();
				break;
			case 'export_listings':
				result = await exportListings();
				break;
			case 'export_reports':
				result = await exportReports();
				break;
			case 'export_messages':
				result = await exportMessages();
				break;
			case 'health_report':
				result = await healthReport();
				break;
			case 'ban_all_users':
				result = await banAllUsers();
				break;
			case 'delete_banned_users':
				result = await deleteBannedUsers();
				break;
			case 'hide_all_listings':
				result = await hideAllListings();
				break;
			case 'restore_all_listings':
				result = await restoreAllListings();
				break;
			case 'delete_inactive_listings':
				result = await deleteInactiveListings();
				break;
			case 'delete_all_listings':
				result = await deleteAllListings();
				break;
			case 'unfeature_all':
				result = await unfeatureAll();
				break;
			case 'dismiss_all_reports':
				result = await dismissAllReports();
				break;
			case 'delete_all_reports':
				result = await deleteAllReports();
				break;
			case 'delete_all_messages':
				result = await deleteAllMessages();
				break;
			case 'delete_messages_older_than': {
				const days = Number(params?.days) || 30;
				result = await deleteMessagesOlderThan(days);
				break;
			}
			case 'delete_favorites':
				result = await deleteFavorites();
				break;
			case 'delete_all_ratings':
				result = await deleteAllRatings();
				break;
			case 'reset_fav_counts':
				result = await resetFavCounts();
				break;
			case 'purge_soft_deleted':
				result = await purgeSoftDeleted();
				break;
			case 'clear_admin_log':
				result = await clearAdminLog();
				break;
			default:
				return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
		}

		if (DESTRUCTIVE_ACTIONS.has(action) || DANGEROUS_ACTIONS.has(action)) {
			await logAdminAction(userId, action, JSON.stringify(result));
		}

		return NextResponse.json({ ok: true, action, result });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Internal error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
