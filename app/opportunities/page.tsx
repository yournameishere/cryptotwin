import type { Metadata } from "next";

import { ErrorNotice } from "@/components/error-notice";
import { OpportunityStream } from "@/components/opportunity-stream";
import { getOpportunitySet } from "@/lib/analysis-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Top Opportunities"
};

export default async function OpportunitiesPage() {
  const result = await loadOpportunities();

  if (!result.ok) {
    return (
      <main className="page page-narrow">
        <section className="route-head">
          <h1>Top opportunities</h1>
        </section>
        <ErrorNotice title="Live market data is unavailable" message={result.message} />
      </main>
    );
  }

  return (
    <main className="page page-narrow">
      <section className="route-head reveal" style={{ "--i": 0 } as React.CSSProperties}>
        <h1>Top opportunities</h1>
        <p>
          Bullish candidates ranked by live similarity, confidence, and the
          matched cohort 30 day rolling path.
        </p>
      </section>
      <OpportunityStream opportunities={result.opportunities} expanded />
    </main>
  );
}

async function loadOpportunities() {
  try {
    const opportunities = await getOpportunitySet();
    return { ok: true as const, opportunities };
  } catch {
    return {
      ok: false as const,
      message: "CoinMarketCap did not return a usable response. Try again shortly."
    };
  }
}
