import Link from "next/link";

import { ErrorNotice } from "@/components/error-notice";
import { OpportunityStream } from "@/components/opportunity-stream";
import { TwinConsole } from "@/components/twin-console";
import { getOpportunitySet } from "@/lib/analysis-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const opportunities = await loadHomeOpportunities();

  return (
    <main className="page page-home">
      <section className="hero-workbench reveal" style={{ "--i": 0 } as React.CSSProperties}>
        <div className="hero-copy">
          <p className="mono-line">Live CMC data - market DNA engine - AI research notes</p>
          <h1>Find the coin moving like this.</h1>
          <p>
            CryptoTwin compares a live asset against the configured CMC universe,
            scores the closest analogues, and turns the match into an explainable
            research workflow.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/discover">
              Analyze asset
            </Link>
            <Link className="btn btn-secondary" href="/methodology">
              View method
            </Link>
          </div>
        </div>
        <div className="hero-console" aria-label="CryptoTwin analyzer">
          <TwinConsole compact />
        </div>
      </section>

      <section className="section-grid reveal" style={{ "--i": 1 } as React.CSSProperties}>
        <div className="section-copy">
          <h2>Opportunities update with the market.</h2>
          <p>
            The ranked list is built from live CoinMarketCap quotes. No browser
            API key, no static token table, no browser-side secrets.
          </p>
        </div>
        {opportunities.ok ? (
          <OpportunityStream opportunities={opportunities.items} />
        ) : (
          <ErrorNotice title="Live opportunities unavailable" message={opportunities.message} />
        )}
      </section>

      <section className="workflow-band reveal" style={{ "--i": 2 } as React.CSSProperties}>
        <div>
          <h2>From quote to thesis.</h2>
          <p>
            The app separates extraction, matching, outcome reading, and strategy
            generation so each step can be inspected.
          </p>
        </div>
        <ol className="workflow-steps">
          {["Extract DNA", "Find twins", "Read outcomes", "Generate rules"].map(
            (step) => (
              <li key={step}>
                <span>{step}</span>
              </li>
            )
          )}
        </ol>
      </section>
    </main>
  );
}

async function loadHomeOpportunities() {
  try {
    return { ok: true as const, items: await getOpportunitySet() };
  } catch {
    return {
      ok: false as const,
      message: "CoinMarketCap data could not be loaded. Check server credentials or try again shortly."
    };
  }
}
