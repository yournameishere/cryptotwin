import "server-only";

import {
  DEFAULT_ANALYZE_RATE_LIMIT,
  DEFAULT_CMC_MAP_CACHE_TTL_MS,
  DEFAULT_CMC_QUOTE_CACHE_TTL_MS,
  DEFAULT_MARKET_UNIVERSE_LIMIT,
  DEFAULT_OPPORTUNITIES_RATE_LIMIT,
  DEFAULT_OPPORTUNITY_SCAN_LIMIT,
  DEFAULT_RATE_LIMIT_WINDOW_MS
} from "@/lib/runtime-config";

export function getServerEnv() {
  return {
    coinMarketCapApiKey:
      process.env.COINMARKETCAP_API_KEY ?? process.env.CMC_API_KEY ?? "",
    openAiApiKey: process.env.OPENAI_API_KEY ?? "",
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    ethereumRpcUrl: process.env.ETHEREUM_RPC_URL ?? "",
    marketUniverseLimit: readIntEnv(
      "MARKET_UNIVERSE_LIMIT",
      DEFAULT_MARKET_UNIVERSE_LIMIT,
      20,
      5000
    ),
    opportunityScanLimit: readIntEnv(
      "OPPORTUNITY_SCAN_LIMIT",
      DEFAULT_OPPORTUNITY_SCAN_LIMIT,
      20,
      500
    ),
    cmcQuoteCacheTtlMs: readIntEnv(
      "CMC_QUOTE_CACHE_TTL_MS",
      DEFAULT_CMC_QUOTE_CACHE_TTL_MS,
      0,
      300_000
    ),
    cmcMapCacheTtlMs: readIntEnv(
      "CMC_MAP_CACHE_TTL_MS",
      DEFAULT_CMC_MAP_CACHE_TTL_MS,
      60_000,
      3_600_000
    ),
    analyzeRateLimit: readIntEnv(
      "ANALYZE_RATE_LIMIT",
      DEFAULT_ANALYZE_RATE_LIMIT,
      1,
      500
    ),
    opportunitiesRateLimit: readIntEnv(
      "OPPORTUNITIES_RATE_LIMIT",
      DEFAULT_OPPORTUNITIES_RATE_LIMIT,
      1,
      1000
    ),
    rateLimitWindowMs: readIntEnv(
      "RATE_LIMIT_WINDOW_MS",
      DEFAULT_RATE_LIMIT_WINDOW_MS,
      1000,
      3_600_000
    ),
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL ?? "",
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
    rateLimitKeySalt: process.env.RATE_LIMIT_KEY_SALT ?? ""
  };
}

export function requireCoinMarketCapKey() {
  const key = getServerEnv().coinMarketCapApiKey.trim();

  if (!key) {
    throw new Error(
      "CoinMarketCap API key is not configured. Add COINMARKETCAP_API_KEY to the server environment."
    );
  }

  return key;
}

function readIntEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
