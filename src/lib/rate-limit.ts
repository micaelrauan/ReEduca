type Entry = { count: number; resetAt: number };

const hits = new Map<string, Entry>();

export type RateLimitConfig = {
	/** max requests per windowMs */
	max: number;
	/** window in ms, default 60_000 */
	windowMs?: number;
	/** unique key prefix */
	key?: string;
};

export function checkRateLimit(
	userId: string,
	cfg: RateLimitConfig,
): { ok: boolean; remaining: number; resetIn: number } {
	const windowMs = cfg.windowMs ?? 60_000;
	const key = `${cfg.key || 'default'}:${userId}`;
	const now = Date.now();
	const entry = hits.get(key);

	if (!entry || now > entry.resetAt) {
		hits.set(key, { count: 1, resetAt: now + windowMs });
		return { ok: true, remaining: cfg.max - 1, resetIn: windowMs };
	}

	entry.count++;
	const remaining = Math.max(0, cfg.max - entry.count);
	const resetIn = entry.resetAt - now;

	return { ok: entry.count <= cfg.max, remaining, resetIn };
}
