import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

// --- Durable backend (Upstash Redis) ----------------------------------------
// Used automatically when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// are set. Falls back to an in-memory limiter otherwise (e.g. local dev),
// so `npm run dev` works with zero setup.

let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

// One Ratelimit instance per distinct (limit, windowSeconds) pair used by the
// app — there are only three call sites, so this map stays tiny.
const limiters = new Map<string, Ratelimit>();
function getLimiter(opts: RateLimitOptions): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const key = `${opts.limit}:${opts.windowSeconds}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    const window = `${opts.windowSeconds} s` as Duration;
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(opts.limit, window),
      analytics: true,
      prefix: "reelnotes",
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// --- In-memory fallback (best-effort; per server instance, not durable) ----

interface Bucket {
  timestamps: number[];
}
const buckets = new Map<string, Bucket>();

function checkInMemory(key: string, { limit, windowSeconds }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  // Opportunistic cleanup so the map doesn't grow unbounded
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.timestamps.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

let warnedNoUpstash = false;

export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const limiter = getLimiter(opts);
  if (!limiter) {
    if (!warnedNoUpstash && process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — " +
          "falling back to an in-memory limiter, which does not persist across " +
          "serverless instances and offers only best-effort protection.",
      );
      warnedNoUpstash = true;
    }
    return checkInMemory(key, opts);
  }

  const { success, reset } = await limiter.limit(key);
  return {
    allowed: success,
    retryAfterSeconds: success ? 0 : Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
  };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}
