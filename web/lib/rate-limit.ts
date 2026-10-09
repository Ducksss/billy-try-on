// Per-IP sliding window kept in memory. It resets on redeploy and is per-instance on
// serverless hosts, which is enough to stop a demo key being drained by one client.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;

export function checkRateLimit(ip: string) {
  const limit = Number(process.env.BILLY_RATE_LIMIT_PER_HOUR || 40);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return { ok: false, retryAfterSeconds: Math.ceil((recent[0] + WINDOW_MS - now) / 1000) };
  }
  recent.push(now);
  hits.set(ip, recent);
  return { ok: true, retryAfterSeconds: 0 };
}
