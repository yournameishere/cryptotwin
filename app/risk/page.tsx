import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Disclosure"
};

const disclosures = [
  {
    title: "Research signal only",
    body: "CryptoTwin AI does not place trades, custody assets, or provide financial advice. Its output is a market-structure comparison that should be reviewed independently."
  },
  {
    title: "Live-market scope",
    body: "The current engine compares assets inside the configured live CoinMarketCap universe and rolling quote windows. It does not claim a complete historical backtest unless a historical snapshot store is added."
  },
  {
    title: "Data-provider dependency",
    body: "Rankings can change when CoinMarketCap data changes, when an upstream endpoint is unavailable, or when an asset has incomplete quote history."
  },
  {
    title: "On-chain metadata",
    body: "Token addresses and platforms come from CoinMarketCap metadata. Ethereum contract checks require ETHEREUM_RPC_URL and should still be verified with a block explorer before acting."
  }
];

export default function RiskPage() {
  return (
    <main className="page page-narrow">
      <section className="route-head reveal" style={{ "--i": 0 } as React.CSSProperties}>
        <h1>Risk disclosure</h1>
        <p>
          Crypto markets are volatile. Treat every match, score, and strategy
          rule as a research input, not an instruction.
        </p>
      </section>

      <section className="method-list reveal" style={{ "--i": 1 } as React.CSSProperties}>
        {disclosures.map((item, index) => (
          <article key={item.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
