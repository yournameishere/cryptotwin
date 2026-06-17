import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ErrorNotice } from "@/components/error-notice";
import { TwinResult } from "@/components/twin-result";
import { analyzeSymbol, AssetNotFoundError } from "@/lib/analysis-service";
import { enrichAnalysisWithAi } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `${symbol.toUpperCase()} Twin`
  };
}

export default async function TwinDetailPage({
  params
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  if (!symbol) {
    notFound();
  }

  const result = await loadTwinReport(symbol);

  if (!result.ok) {
    return (
      <main className="page page-narrow">
        <section className="route-head">
          <Link className="text-link" href="/discover">
            Back to discovery
          </Link>
          <h1>{symbol.toUpperCase()} twin report</h1>
        </section>
        <ErrorNotice title="Twin report unavailable" message={result.message} />
      </main>
    );
  }

  return (
    <main className="page page-narrow">
      <section className="route-head reveal" style={{ "--i": 0 } as React.CSSProperties}>
        <Link className="text-link" href="/discover">
          Back to discovery
        </Link>
        <h1>{result.analysis.currentAsset.symbol} twin report</h1>
        <p>
          Live market DNA, closest analogues, rolling outcomes, and strategy
          rails for this asset.
        </p>
      </section>
      <TwinResult analysis={result.analysis} expanded />
    </main>
  );
}

async function loadTwinReport(symbol: string) {
  try {
    const analysis = await enrichAnalysisWithAi(await analyzeSymbol(symbol));
    return { ok: true as const, analysis };
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return {
        ok: false as const,
        message: "No active CoinMarketCap asset matched that ticker, slug, or CMC ID."
      };
    }

    return {
      ok: false as const,
      message: "The report could not be generated. Try again shortly."
    };
  }
}
