import "server-only";

import { requireCoinMarketCapKey } from "@/lib/env";
import type { MarketAsset } from "@/lib/types";

const CMC_BASE_URL = "https://pro-api.coinmarketcap.com";
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; value: unknown }>();

type CmcQuote = {
  price?: number;
  volume_24h?: number;
  percent_change_1h?: number;
  percent_change_24h?: number;
  percent_change_7d?: number;
  percent_change_30d?: number;
  percent_change_60d?: number;
  percent_change_90d?: number;
  market_cap?: number;
  last_updated?: string;
};

type CmcAsset = {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank?: number;
  date_added?: string | null;
  num_market_pairs?: number | null;
  circulating_supply?: number | null;
  total_supply?: number | null;
  max_supply?: number | null;
  tags?: string[];
  platform?: {
    name?: string;
    symbol?: string;
    token_address?: string;
  } | null;
  last_updated?: string;
  quote?: {
    USD?: CmcQuote;
  };
};

type CmcMapAsset = {
  id: number;
  name?: string;
  symbol: string;
  slug?: string;
  rank?: number | null;
};

type CmcResponse<T> = {
  status?: {
    error_code?: number;
    error_message?: string | null;
    elapsed?: number;
    credit_count?: number;
  };
  data: T;
};

export class CoinMarketCapError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public cmcCode?: number
  ) {
    super(message);
    this.name = "CoinMarketCapError";
  }
}

async function requestCoinMarketCap<T>(
  path: string,
  params: Record<string, string>,
  ttlMs = CACHE_TTL_MS
): Promise<T> {
  const apiKey = requireCoinMarketCapKey();
  const url = new URL(path, CMC_BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const cacheKey = url.toString();
  const hit = cache.get(cacheKey);
  const now = Date.now();

  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-CMC_PRO_API_KEY": apiKey
        },
        cache: "no-store"
      });

      const payload = (await response.json().catch(() => null)) as
        | CmcResponse<T>
        | null;

      if (!response.ok) {
        throw new CoinMarketCapError(
          payload?.status?.error_message ??
            `CoinMarketCap request failed with ${response.status}.`,
          response.status,
          payload?.status?.error_code
        );
      }

      if (!payload || payload.status?.error_code) {
        throw new CoinMarketCapError(
          payload?.status?.error_message ??
            "CoinMarketCap returned an invalid response.",
          response.status,
          payload?.status?.error_code
        );
      }

      const data = payload?.data as T;
      cache.set(cacheKey, { expiresAt: now + ttlMs, value: data });
      return data;
    } catch (error) {
      lastError = error;

      if (
        error instanceof CoinMarketCapError &&
        error.statusCode !== 429 &&
        error.statusCode < 500
      ) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 250)
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("CoinMarketCap request failed.");
}

function toMarketAsset(asset: CmcAsset): MarketAsset | null {
  const quote = asset.quote?.USD;
  const price = quote?.price;
  const marketCap = quote?.market_cap;
  const volume24h = quote?.volume_24h;

  if (
    !quote ||
    !isFiniteNumber(price) ||
    !isFiniteNumber(marketCap) ||
    !isFiniteNumber(volume24h)
  ) {
    return null;
  }

  return {
    id: asset.id,
    name: asset.name,
    symbol: asset.symbol,
    slug: asset.slug,
    rank: asset.cmc_rank ?? 0,
    price,
    volume24h,
    marketCap,
    circulatingSupply: asset.circulating_supply ?? null,
    totalSupply: asset.total_supply ?? null,
    maxSupply: asset.max_supply ?? null,
    dateAdded: asset.date_added ?? null,
    numMarketPairs: asset.num_market_pairs ?? null,
    tags: Array.isArray(asset.tags) ? asset.tags.slice(0, 8) : [],
    percentChange1h: quote.percent_change_1h ?? null,
    percentChange24h: quote.percent_change_24h ?? null,
    percentChange7d: quote.percent_change_7d ?? null,
    percentChange30d: quote.percent_change_30d ?? null,
    percentChange60d: quote.percent_change_60d ?? null,
    percentChange90d: quote.percent_change_90d ?? null,
    platform: asset.platform
      ? {
          name: asset.platform.name ?? "Unknown chain",
          symbol: asset.platform.symbol ?? "",
          tokenAddress: asset.platform.token_address ?? null
        }
      : null,
    onChainVerification: asset.platform?.token_address
      ? {
          network: asset.platform.name ?? "Unknown chain",
          address: asset.platform.token_address,
          status: "metadata-only",
          source: "coinmarketcap",
          checkedAt: quote.last_updated ?? asset.last_updated ?? null
        }
      : null,
    lastUpdated: quote.last_updated ?? asset.last_updated ?? new Date().toISOString()
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function getLatestListings(limit = 250) {
  const data = await requestCoinMarketCap<CmcAsset[]>(
    "/v1/cryptocurrency/listings/latest",
    {
      start: "1",
      limit: String(limit),
      convert: "USD",
      sort: "market_cap",
      sort_dir: "desc",
      aux: "num_market_pairs,cmc_rank,date_added,tags,platform,max_supply,circulating_supply,total_supply"
    }
  );

  return data.map(toMarketAsset).filter((asset): asset is MarketAsset => Boolean(asset));
}

export async function resolveAssetByQuery(query: string) {
  const clean = query.trim();
  const id = parseCmcId(clean);

  if (id !== null) {
    return resolveAssetById(id);
  }

  const bySymbol = /^[a-zA-Z0-9]+$/.test(clean)
    ? await resolveAssetBySymbol(clean)
    : null;

  if (bySymbol) {
    return bySymbol;
  }

  return resolveAssetFromMap(clean);
}

async function resolveAssetById(id: number) {
  try {
    return (await getQuotesByIds([id]))[0] ?? null;
  } catch (error) {
    if (error instanceof CoinMarketCapError && error.statusCode === 400) {
      return null;
    }

    throw error;
  }
}

function parseCmcId(query: string) {
  if (!/^\d{1,10}$/.test(query)) {
    return null;
  }

  const id = Number(query);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function resolveAssetBySymbol(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  let mapData: CmcMapAsset[];

  try {
    mapData = await requestCoinMarketCap<CmcMapAsset[]>(
      "/v1/cryptocurrency/map",
      {
        symbol: normalized,
        listing_status: "active"
      },
      5 * CACHE_TTL_MS
    );
  } catch (error) {
    if (error instanceof CoinMarketCapError && error.statusCode === 400) {
      return null;
    }

    throw error;
  }

  const ids = mapData
    .filter((asset) => asset.symbol.toUpperCase() === normalized)
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 5)
    .map((asset) => asset.id);

  if (!ids.length) {
    return null;
  }

  const quotes = await getQuotesByIds(ids);
  return quotes.sort((a, b) => b.marketCap - a.marketCap)[0] ?? null;
}

async function resolveAssetFromMap(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const mapData = await requestCoinMarketCap<CmcMapAsset[]>(
    "/v1/cryptocurrency/map",
    {
      listing_status: "active",
      start: "1",
      limit: "5000",
      sort: "cmc_rank"
    },
    5 * CACHE_TTL_MS
  );

  const match = mapData
    .filter((asset) => {
      const symbol = asset.symbol.toLowerCase();
      const slug = asset.slug?.toLowerCase();
      const name = asset.name?.toLowerCase();
      return symbol === normalized || slug === normalized || name === normalized;
    })
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))[0];

  if (!match) {
    return null;
  }

  return resolveAssetById(match.id);
}

export async function findAssetsBySymbol(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  const mapData = await requestCoinMarketCap<CmcMapAsset[]>(
    "/v1/cryptocurrency/map",
    {
      symbol: normalized,
      listing_status: "active"
    },
    5 * CACHE_TTL_MS
  );
  const ids = mapData
    .filter((asset) => asset.symbol.toUpperCase() === normalized)
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 5)
    .map((asset) => asset.id);

  return ids.length ? getQuotesByIds(ids) : [];
}

export async function getQuotesByIds(ids: number[]) {
  const data = await requestCoinMarketCap<Record<string, CmcAsset> | CmcAsset[]>(
    "/v2/cryptocurrency/quotes/latest",
    {
      id: ids.join(","),
      convert: "USD",
      aux: "num_market_pairs,cmc_rank,date_added,tags,platform,max_supply,circulating_supply,total_supply"
    }
  );

  const rows = Array.isArray(data) ? data : Object.values(data).flat();
  return rows.map(toMarketAsset).filter((asset): asset is MarketAsset => Boolean(asset));
}
