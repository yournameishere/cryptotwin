import { createHash } from "node:crypto";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const RATE_LIMIT_PREFIX = "cryptotwin:rate-limit";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export async function checkRateLimit({
  key,
  limit,
  windowMs
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const durableResult = await checkDurableRateLimit({ key, limit, windowMs });

  if (durableResult) {
    return durableResult;
  }

  return checkMemoryRateLimit({ key, limit, windowMs });
}

function checkMemoryRateLimit({
  key,
  limit,
  windowMs
}: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();

  for (const [bucketKey, bucket] of buckets) {
    if (bucket.resetAt <= now || buckets.size > 10_000) {
      buckets.delete(bucketKey);
    }
  }

  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt
  };
}

export function getClientKey(request: Request, scope: string) {
  const identifier = [
    getClientIp(request),
    request.headers.get("user-agent")?.slice(0, 160) || "unknown-agent"
  ].join("|");

  return `${scope}:${hashIdentifier(identifier)}`;
}

async function checkDurableRateLimit({
  key,
  limit,
  windowMs
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult | null> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !token) {
    return null;
  }

  try {
    const redisKey = `${RATE_LIMIT_PREFIX}:${key}`;
    const response = await fetch(`${restUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, windowMs],
        ["PTTL", redisKey]
      ]),
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const rows = (await response.json().catch(() => null)) as
      | Array<{ result?: unknown; error?: string }>
      | null;

    if (!Array.isArray(rows) || rows.some((row) => row.error)) {
      return null;
    }

    const count = Number(rows[0]?.result);
    const ttl = Number(rows[2]?.result);

    if (!Number.isFinite(count) || !Number.isFinite(ttl)) {
      return null;
    }

    const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs);
    const allowed = count <= limit;

    return {
      allowed,
      remaining: allowed ? Math.max(0, limit - count) : 0,
      resetAt
    };
  } catch {
    return null;
  }
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .find(Boolean);

  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    forwardedFor
  ];

  return (
    candidates
      .map((value) => value?.trim())
      .find((value) => value && value.toLowerCase() !== "unknown")
      ?.slice(0, 100) ?? "local"
  );
}

function hashIdentifier(identifier: string) {
  return createHash("sha256")
    .update(process.env.RATE_LIMIT_KEY_SALT ?? "")
    .update(identifier)
    .digest("hex")
    .slice(0, 40);
}
