/**
 * Community usage counters, aggregated across every device that uses the app.
 * Backed by an Upstash-compatible Redis REST store (the free KV integration in
 * the Vercel dashboard); until one is attached the endpoint reports
 * `available: false` and quietly swallows tracking beacons, so the client
 * needs no environment knowledge.
 */

const COUNTERS = ["sessions", "seconds", "searches", "card_taps", "favorites", "asks", "shares"] as const;
type Counter = (typeof COUNTERS)[number];

/** Per-request caps: one beacon can never move a counter by more than this. */
const EVENT_CAPS: Record<Counter, number> = {
  sessions: 1,
  seconds: 4 * 60 * 60,
  searches: 60,
  card_taps: 120,
  favorites: 40,
  asks: 20,
  shares: 30,
};

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const recentByIp = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const kept = (recentByIp.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  kept.push(now);
  recentByIp.set(ip, kept);
  if (recentByIp.size > 5000) recentByIp.clear();
  return kept.length > RATE_LIMIT;
}

/**
 * Vercel's storage integrations name their REST credentials differently
 * depending on which one is attached (legacy Vercel KV, the Upstash
 * marketplace entry, or a hand-rolled pair), so accept every spelling
 * rather than making the choice of integration matter.
 */
const URL_KEYS = ["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "REDIS_REST_API_URL", "STORAGE_REST_API_URL"];
const TOKEN_KEYS = [
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_TOKEN",
  "REDIS_REST_API_TOKEN",
  "STORAGE_REST_API_TOKEN",
];

function firstEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

function redisEnv(): { url: string; token: string } | null {
  const url = firstEnv(URL_KEYS);
  const token = firstEnv(TOKEN_KEYS);
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

async function pipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  const env = redisEnv();
  if (!env) return null;
  const res = await fetch(`${env.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  const rows = (await res.json()) as { result?: unknown; error?: string }[];
  return rows.map((r) => r.result);
}

export async function handleStats(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  if (request.method === "GET") {
    if (!redisEnv()) {
      // "no_store": nothing attached yet. The home page hides the section.
      return Response.json({ available: false, reason: "no_store" }, { headers: { "Cache-Control": "s-maxage=60" } });
    }
    try {
      const rows = await pipeline([["PFCOUNT", "stats:devices"], ...COUNTERS.map((c) => ["GET", `stats:${c}`])]);
      const nums = (rows || []).map((v) => Number(v) || 0);
      const [devices, ...rest] = nums;
      const body: Record<string, number | boolean> = { available: true, devices };
      COUNTERS.forEach((c, i) => (body[c] = rest[i]));
      return Response.json(body, {
        // One request a minute serves the whole family via the CDN.
        headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=600" },
      });
    } catch (err) {
      // Attached but unreachable/misconfigured — say so instead of looking empty.
      return Response.json(
        { available: false, reason: "store_error", detail: String((err as Error).message || err).slice(0, 120) },
        { status: 200 },
      );
    }
  }

  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return new Response(null, { status: 429 });
  if (Number(request.headers.get("content-length") || 0) > 4096) return new Response(null, { status: 413 });

  let body: { device?: unknown; events?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return new Response(null, { status: 400 });
  }
  const device = typeof body.device === "string" && /^[a-z0-9-]{8,64}$/.test(body.device) ? body.device : null;
  const events = (body.events || {}) as Record<string, unknown>;
  if (!device) return new Response(null, { status: 400 });

  const commands: (string | number)[][] = [["PFADD", "stats:devices", device]];
  for (const counter of COUNTERS) {
    const n = Math.min(Math.max(0, Math.floor(Number(events[counter]) || 0)), EVENT_CAPS[counter]);
    if (n > 0) commands.push(["INCRBY", `stats:${counter}`, n]);
  }
  try {
    await pipeline(commands); // no-op (null) when no store is attached
  } catch {
    /* the beacon is fire-and-forget; losing one is fine */
  }
  return new Response(null, { status: 204 });
}
