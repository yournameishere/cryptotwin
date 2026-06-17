import "server-only";

export function getServerEnv() {
  return {
    coinMarketCapApiKey:
      process.env.COINMARKETCAP_API_KEY ?? process.env.CMC_API_KEY ?? "",
    openAiApiKey: process.env.OPENAI_API_KEY ?? "",
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    ethereumRpcUrl: process.env.ETHEREUM_RPC_URL ?? "",
    marketUniverseLimit: readIntEnv("MARKET_UNIVERSE_LIMIT", 500, 20, 5000),
    opportunityScanLimit: readIntEnv("OPPORTUNITY_SCAN_LIMIT", 120, 20, 500),
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
