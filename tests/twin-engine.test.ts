import assert from "node:assert/strict";
import test from "node:test";

import { checkRateLimit } from "../lib/rate-limit";
import { createOpportunities, createTwinAnalysis, extractDna } from "../lib/twin-engine";
import type { MarketAsset } from "../lib/types";

test("extractDna treats zero percent changes as real values", () => {
  const dna = extractDna(makeAsset({ symbol: "ZERO", percentChange30d: 0 }));
  assert.equal(dna.momentum, 50);
});

test("bearish twin cohorts do not receive a long-side take profit", () => {
  const current = makeAsset({ id: 1, symbol: "CUR", percentChange30d: -4 });
  const candidates = [
    current,
    makeAsset({ id: 2, symbol: "NEG1", percentChange30d: -18 }),
    makeAsset({ id: 3, symbol: "NEG2", percentChange30d: -14 }),
    makeAsset({ id: 4, symbol: "NEG3", percentChange30d: -10 })
  ];

  const analysis = createTwinAnalysis(current, candidates);
  const longTarget = analysis.strategy.find((rule) => rule.label === "Long target");

  assert.equal(analysis.expectedDirection, "Bearish");
  assert.equal(longTarget?.value, "Inactive");
});

test("insufficient 30 day samples keep strategy target inactive", () => {
  const current = makeAsset({ id: 1, symbol: "CUR", percentChange30d: 4 });
  const candidates = [
    current,
    makeAsset({ id: 2, symbol: "ONE", percentChange30d: 40 }),
    makeAsset({ id: 3, symbol: "MISS1", percentChange30d: null }),
    makeAsset({ id: 4, symbol: "MISS2", percentChange30d: null })
  ];

  const analysis = createTwinAnalysis(current, candidates);
  const longTarget = analysis.strategy.find((rule) => rule.label === "Long target");

  assert.equal(analysis.expectedReturn30d, null);
  assert.equal(analysis.expectedDirection, "Neutral");
  assert.equal(analysis.outcomeSampleSize, 1);
  assert.equal(longTarget?.value, "Inactive");
});

test("opportunities carry stable CMC asset ids for report links", () => {
  const current = makeAsset({ id: 1, symbol: "CUR", percentChange30d: 12 });
  const candidates = [
    current,
    makeAsset({ id: 2, symbol: "TWIN1", percentChange30d: 16 }),
    makeAsset({ id: 3, symbol: "TWIN2", percentChange30d: 14 }),
    makeAsset({ id: 4, symbol: "TWIN3", percentChange30d: 10 })
  ];

  const opportunities = createOpportunities(candidates);

  assert.ok(opportunities.length > 0);
  assert.ok(
    opportunities.every((item) =>
      candidates.some((asset) => asset.id === item.id && asset.slug === item.slug)
    )
  );
});

test("rate limiter blocks requests after the configured bucket is exhausted", async () => {
  const key = `test:${Date.now()}:${Math.random()}`;

  assert.equal((await checkRateLimit({ key, limit: 2, windowMs: 60_000 })).allowed, true);
  assert.equal((await checkRateLimit({ key, limit: 2, windowMs: 60_000 })).allowed, true);
  assert.equal((await checkRateLimit({ key, limit: 2, windowMs: 60_000 })).allowed, false);
});

function makeAsset(overrides: Partial<MarketAsset> = {}): MarketAsset {
  return {
    id: overrides.id ?? 100,
    name: overrides.name ?? overrides.symbol ?? "Asset",
    symbol: overrides.symbol ?? "ASSET",
    slug: overrides.slug ?? (overrides.symbol ?? "asset").toLowerCase(),
    rank: overrides.rank ?? 50,
    price: overrides.price ?? 1,
    volume24h: overrides.volume24h ?? 20_000_000,
    marketCap: overrides.marketCap ?? 100_000_000,
    circulatingSupply: overrides.circulatingSupply ?? 100_000_000,
    totalSupply: overrides.totalSupply ?? 100_000_000,
    maxSupply: overrides.maxSupply ?? null,
    dateAdded: overrides.dateAdded ?? "2024-01-01T00:00:00.000Z",
    numMarketPairs: overrides.numMarketPairs ?? 25,
    tags: overrides.tags ?? [],
    percentChange1h: overrides.percentChange1h !== undefined ? overrides.percentChange1h : 0,
    percentChange24h:
      overrides.percentChange24h !== undefined ? overrides.percentChange24h : 0,
    percentChange7d: overrides.percentChange7d !== undefined ? overrides.percentChange7d : 0,
    percentChange30d:
      overrides.percentChange30d !== undefined ? overrides.percentChange30d : 0,
    percentChange60d:
      overrides.percentChange60d !== undefined ? overrides.percentChange60d : 0,
    percentChange90d:
      overrides.percentChange90d !== undefined ? overrides.percentChange90d : 0,
    platform: overrides.platform ?? null,
    onChainVerification: overrides.onChainVerification ?? null,
    lastUpdated: overrides.lastUpdated ?? "2026-01-01T00:00:00.000Z"
  };
}
