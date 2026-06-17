export type NumericWindow = "1h" | "24h" | "7d" | "30d" | "60d" | "90d";

export type MarketAsset = {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  price: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  dateAdded: string | null;
  numMarketPairs: number | null;
  tags: string[];
  percentChange1h: number | null;
  percentChange24h: number | null;
  percentChange7d: number | null;
  percentChange30d: number | null;
  percentChange60d: number | null;
  percentChange90d: number | null;
  platform: {
    name: string;
    symbol: string;
    tokenAddress: string | null;
  } | null;
  onChainVerification: {
    network: string;
    address: string;
    status: "metadata-only" | "contract-found" | "contract-not-found" | "rpc-unavailable";
    source: "coinmarketcap" | "rpc";
    checkedAt: string | null;
  } | null;
  lastUpdated: string;
};

export type DnaProfile = {
  volumeGrowth: number;
  momentum: number;
  attention: number;
  volatility: number;
  liquidity: number;
  marketCapStage: number;
  rank: number;
};

export type TwinOutcome = {
  window: "7d" | "30d" | "60d" | "90d";
  returnPct: number | null;
};

export type TwinMatch = {
  asset: MarketAsset;
  dna: DnaProfile;
  similarity: number;
  distance: number;
  drivers: string[];
  outcomes: TwinOutcome[];
};

export type StrategyRule = {
  label: string;
  value: string;
  reason: string;
};

export type TwinAnalysis = {
  currentAsset: MarketAsset;
  currentDna: DnaProfile;
  twins: TwinMatch[];
  expectedDirection: "Bullish" | "Neutral" | "Bearish";
  confidence: number;
  expectedReturn30d: number | null;
  outcomeSampleSize: number;
  outcomeMinimumSampleSize: number;
  strategy: StrategyRule[];
  explanation: string;
  dataMode: "live-cmc" | "live-cmc-with-ai";
  generatedAt: string;
};

export type Opportunity = {
  id: number;
  slug: string;
  symbol: string;
  name: string;
  rank: number;
  similarity: number;
  twinSymbol: string;
  twinName: string;
  expectedReturn30d: number | null;
  confidence: number;
  direction: TwinAnalysis["expectedDirection"];
};
