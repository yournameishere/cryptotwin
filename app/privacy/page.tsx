import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy"
};

const privacyNotes = [
  {
    title: "Inputs",
    body: "The app accepts tickers and slugs entered by the user. It does not ask for wallet keys, seed phrases, exchange credentials, or personal trading accounts."
  },
  {
    title: "Server calls",
    body: "CoinMarketCap and OpenAI requests are made from server-only modules. API keys are not sent to the browser."
  },
  {
    title: "AI enrichment",
    body: "When OpenAI enrichment is enabled, the app sends only the generated analysis JSON needed to write a concise explanation."
  },
  {
    title: "Storage",
    body: "This codebase does not include user accounts, persistent user portfolios, or client-side tracking storage."
  }
];

export default function PrivacyPage() {
  return (
    <main className="page page-narrow">
      <section className="route-head reveal" style={{ "--i": 0 } as React.CSSProperties}>
        <h1>Privacy</h1>
        <p>
          CryptoTwin AI keeps the current product surface narrow: ticker input,
          server-side market data, and optional AI explanation.
        </p>
      </section>

      <section className="method-list reveal" style={{ "--i": 1 } as React.CSSProperties}>
        {privacyNotes.map((item, index) => (
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
