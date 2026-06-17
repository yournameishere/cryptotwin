import "server-only";

import { getLatestListings, resolveAssetByQuery } from "@/lib/cmc";
import { getServerEnv } from "@/lib/env";
import { enrichAssetOnChain } from "@/lib/onchain";
import { createOpportunities, createTwinAnalysis } from "@/lib/twin-engine";
import type { MarketAsset } from "@/lib/types";

export class AssetNotFoundError extends Error {
  constructor(query: string) {
    super(`No active CoinMarketCap asset matched "${query}".`);
    this.name = "AssetNotFoundError";
  }
}

export async function getMarketUniverse() {
  return getLatestListings(getServerEnv().marketUniverseLimit);
}

export async function analyzeSymbol(symbol: string) {
  const universe = await getMarketUniverse();
  const query = symbol.trim();
  const normalizedQuery = query.toUpperCase();
  let current: MarketAsset | null = findBestLocalMatch(universe, normalizedQuery);

  if (!current) {
    current = await resolveAssetByQuery(query);
  }

  if (!current) {
    throw new AssetNotFoundError(query);
  }

  current = await enrichAssetOnChain(current);

  const candidates: MarketAsset[] = universe.some((asset) => asset.id === current.id)
    ? universe.map((asset) => (asset.id === current.id ? current : asset))
    : [current, ...universe];

  return createTwinAnalysis(current, candidates);
}

function findBestLocalMatch(universe: MarketAsset[], query: string) {
  const matches = universe.filter(
    (asset) =>
      asset.symbol.toUpperCase() === query ||
      asset.slug.toUpperCase() === query ||
      asset.name.toUpperCase() === query
  );

  return matches.sort((a, b) => a.rank - b.rank)[0] ?? null;
}

export async function getOpportunitySet() {
  const universe = await getMarketUniverse();
  return createOpportunities(universe, getServerEnv().opportunityScanLimit);
}
