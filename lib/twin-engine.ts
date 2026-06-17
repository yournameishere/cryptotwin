import { average, clamp } from "@/lib/format";
import type {
  DnaProfile,
  MarketAsset,
  Opportunity,
  StrategyRule,
  TwinAnalysis,
  TwinMatch
} from "@/lib/types";

const WEIGHTS = {
  volumeGrowth: 0.19,
  momentum: 0.22,
  attention: 0.16,
  volatility: 0.16,
  liquidity: 0.12,
  marketCapStage: 0.15
};
const MIN_30D_OUTCOME_SAMPLES = 2;

function safeLog(value: number) {
  return Math.log10(Math.max(value, 1));
}

function normalizePercent(value: number | null, divisor: number) {
  if (value === null || !Number.isFinite(value)) {
    return 50;
  }

  return clamp(50 + (value / divisor) * 50, 0, 100);
}

function weightedChange(value: number | null, weight: number) {
  return typeof value === "number" && Number.isFinite(value) ? value * weight : null;
}

function stdev(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    values.length;
  return Math.sqrt(variance);
}

export function extractDna(asset: MarketAsset): DnaProfile {
  const changes = [
    asset.percentChange1h,
    asset.percentChange24h,
    asset.percentChange7d,
    asset.percentChange30d,
    asset.percentChange60d,
    asset.percentChange90d
  ].filter((value): value is number => typeof value === "number");

  const weightedMomentum = average([
    weightedChange(asset.percentChange24h, 0.18),
    weightedChange(asset.percentChange7d, 0.22),
    weightedChange(asset.percentChange30d, 0.25),
    weightedChange(asset.percentChange60d, 0.2),
    weightedChange(asset.percentChange90d, 0.15)
  ]);

  const turnover = asset.volume24h / Math.max(asset.marketCap, 1);
  const marketCapStage = clamp(100 - safeLog(asset.marketCap) * 8.5, 0, 100);

  return {
    volumeGrowth: clamp(turnover * 500, 0, 100),
    momentum: normalizePercent(weightedMomentum, 70),
    attention: clamp(turnover * 340 + Math.max(0, 140 - asset.rank) * 0.12, 0, 100),
    volatility: clamp(stdev(changes) * 2.6, 0, 100),
    liquidity: clamp((safeLog(asset.volume24h) - 4) * 14, 0, 100),
    marketCapStage,
    rank: asset.rank
  };
}

function profileDistance(a: DnaProfile, b: DnaProfile) {
  return Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
    const profileKey = key as keyof typeof WEIGHTS;
    return sum + Math.abs(a[profileKey] - b[profileKey]) * weight;
  }, 0);
}

function similarityFromDistance(distance: number) {
  return clamp(Math.round(100 - distance * 1.08), 1, 99);
}

function buildDrivers(current: DnaProfile, twin: DnaProfile) {
  const deltas: Array<[string, number]> = [
    ["Momentum curve", Math.abs(current.momentum - twin.momentum)],
    ["Volume intensity", Math.abs(current.volumeGrowth - twin.volumeGrowth)],
    ["Attention proxy", Math.abs(current.attention - twin.attention)],
    ["Volatility band", Math.abs(current.volatility - twin.volatility)],
    ["Market-cap stage", Math.abs(current.marketCapStage - twin.marketCapStage)],
    ["Liquidity depth", Math.abs(current.liquidity - twin.liquidity)]
  ];

  return deltas
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([label]) => label);
}

function buildStrategy(
  current: MarketAsset,
  expectedReturn30d: number | null,
  confidence: number
): StrategyRule[] {
  const volatility = extractDna(current).volatility;
  const stopLoss = -Math.round(clamp(volatility * 0.18 + 6, 7, 22));
  const hasLongTarget = expectedReturn30d !== null && expectedReturn30d > 6;
  const takeProfit = hasLongTarget
    ? Math.round(clamp(expectedReturn30d * 0.68, 8, 80))
    : null;
  const holdDays = confidence > 78 ? "30-60 days" : "14-30 days";
  const targetRule: StrategyRule = hasLongTarget
    ? {
        label: "Take profit",
        value: `+${takeProfit}%`,
        reason:
          "Based on the matched twin cohort's positive rolling 30 day path and current volatility."
      }
    : {
        label: "Long target",
        value: "Inactive",
        reason:
          expectedReturn30d === null
            ? "Closest live twins do not have enough 30 day quote history for a long-side target."
            : "Closest live twins are not positive enough to justify a long-side target."
      };

  return [
    {
      label: "Entry",
      value: "Watch current range",
      reason: "The engine waits for the live DNA profile to stay aligned after the latest CMC refresh."
    },
    targetRule,
    {
      label: "Stop loss",
      value: `${stopLoss}%`,
      reason: "Risk is widened when the asset's volatility profile is already elevated."
    },
    {
      label: "Holding window",
      value: holdDays,
      reason: "Higher confidence twins can hold longer; weaker matches should be reviewed sooner."
    }
  ];
}

export function createTwinAnalysis(
  currentAsset: MarketAsset,
  candidates: MarketAsset[]
): TwinAnalysis {
  const currentDna = extractDna(currentAsset);
  const twins: TwinMatch[] = candidates
    .filter((candidate) => candidate.id !== currentAsset.id)
    .map((asset) => {
      const dna = extractDna(asset);
      const distance = profileDistance(currentDna, dna);

      return {
        asset,
        dna,
        distance,
        similarity: similarityFromDistance(distance),
        drivers: buildDrivers(currentDna, dna),
        outcomes: [
          { window: "7d", returnPct: asset.percentChange7d },
          { window: "30d", returnPct: asset.percentChange30d },
          { window: "60d", returnPct: asset.percentChange60d },
          { window: "90d", returnPct: asset.percentChange90d }
        ] as TwinMatch["outcomes"]
      };
    })
    .filter((match) => match.similarity >= 35)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  const topThree = twins.slice(0, 3);
  const topThree30dReturns = topThree
    .map((match) => match.asset.percentChange30d)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const expectedReturn30d =
    topThree30dReturns.length >= MIN_30D_OUTCOME_SAMPLES
      ? average(topThree30dReturns)
      : null;
  const confidence = clamp(
    Math.round(
      average(topThree.map((match) => match.similarity)) ??
        twins[0]?.similarity ??
        0
    ),
    0,
    99
  );
  const expectedDirection =
    expectedReturn30d === null
      ? "Neutral"
      : expectedReturn30d > 6
        ? "Bullish"
        : expectedReturn30d < -6
          ? "Bearish"
          : "Neutral";

  return {
    currentAsset,
    currentDna,
    twins,
    expectedDirection,
    confidence,
    expectedReturn30d,
    outcomeSampleSize: topThree30dReturns.length,
    outcomeMinimumSampleSize: MIN_30D_OUTCOME_SAMPLES,
    strategy: buildStrategy(currentAsset, expectedReturn30d, confidence),
    explanation: buildFallbackExplanation(currentAsset, twins, expectedReturn30d),
    dataMode: "live-cmc",
    generatedAt: new Date().toISOString()
  };
}

export function buildFallbackExplanation(
  currentAsset: MarketAsset,
  twins: TwinMatch[],
  expectedReturn30d: number | null
) {
  const best = twins[0];

  if (!best) {
    return `${currentAsset.symbol} does not have a strong enough live-market twin in the configured CMC universe. Expand the universe or check again after the next market refresh.`;
  }

  const returnText =
    expectedReturn30d === null
      ? "not enough 30 day data to estimate a cohort return"
      : `${expectedReturn30d.toFixed(2)}% average 30 day return across the closest live twins`;

  return `${currentAsset.symbol} currently maps closest to ${best.asset.symbol}. The strongest shared signals are ${best.drivers.join(", ").toLowerCase()}. The matched cohort shows ${returnText}. Treat this as a research signal, not financial advice.`;
}

export function createOpportunities(assets: MarketAsset[], scanLimit = 120) {
  return assets
    .slice(0, scanLimit)
    .map((asset) => {
      const analysis = createTwinAnalysis(asset, assets);
      const twin = analysis.twins[0];

      if (!twin) {
        return null;
      }

      return {
        id: asset.id,
        slug: asset.slug,
        symbol: asset.symbol,
        name: asset.name,
        rank: asset.rank,
        similarity: twin.similarity,
        twinSymbol: twin.asset.symbol,
        twinName: twin.asset.name,
        expectedReturn30d: analysis.expectedReturn30d,
        confidence: analysis.confidence,
        direction: analysis.expectedDirection
      } satisfies Opportunity;
    })
    .filter((item): item is Opportunity => Boolean(item))
    .filter(
      (item) =>
        item.direction === "Bullish" &&
        item.expectedReturn30d !== null &&
        item.expectedReturn30d > 6
    )
    .sort((a, b) => {
      const scoreA =
        a.similarity + a.confidence + Math.max(a.expectedReturn30d ?? -20, -20);
      const scoreB =
        b.similarity + b.confidence + Math.max(b.expectedReturn30d ?? -20, -20);
      return scoreB - scoreA;
    })
    .slice(0, 12);
}
