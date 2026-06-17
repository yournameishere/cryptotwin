import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology"
};

export default function MethodologyPage() {
  return (
    <main className="page page-narrow">
      <section className="route-head reveal" style={{ "--i": 0 } as React.CSSProperties}>
        <h1>How CryptoTwin works</h1>
        <p>
          The engine does not predict price directly. It asks whether the live
          market structure of one asset resembles another asset in the configured
          CoinMarketCap universe.
        </p>
      </section>

      <section className="method-list reveal" style={{ "--i": 1 } as React.CSSProperties}>
        <article>
          <span>Input</span>
          <h2>CoinMarketCap market data</h2>
          <p>
            Server routes call CoinMarketCap Pro with the recommended
            X-CMC_PRO_API_KEY header. The browser never receives the key.
          </p>
        </article>
        <article>
          <span>Extraction</span>
          <h2>Market DNA profile</h2>
          <p>
            The profile normalizes volume intensity, momentum windows, attention
            proxy, volatility, liquidity, and market-cap stage.
          </p>
        </article>
        <article>
          <span>Search</span>
          <h2>Twin matching</h2>
          <p>
            Each candidate receives a weighted distance score. Lower distance
            becomes higher similarity, with the top live matches exposed for
            review.
          </p>
        </article>
        <article>
          <span>Chain</span>
          <h2>Metadata and optional RPC check</h2>
          <p>
            Token platforms and addresses come from CoinMarketCap. Ethereum
            contract checks run only when ETHEREUM_RPC_URL is configured.
          </p>
        </article>
        <article>
          <span>Strategy</span>
          <h2>Rules, not blind calls</h2>
          <p>
            The app turns the match into a research plan with confidence, risk,
            and time window. It is not financial advice.
          </p>
        </article>
      </section>
    </main>
  );
}
