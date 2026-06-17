import type { Metadata } from "next";

import { TwinConsole } from "@/components/twin-console";

export const metadata: Metadata = {
  title: "Discover Twins"
};

export default function DiscoverPage() {
  return (
    <main className="page page-narrow">
      <section className="route-head reveal" style={{ "--i": 0 } as React.CSSProperties}>
        <h1>Twin discovery</h1>
        <p>
          Enter a ticker, slug, or CMC ID. The server resolves the CMC asset,
          extracts a market DNA profile, and returns the closest live-market twins.
        </p>
      </section>
      <TwinConsole />
    </main>
  );
}
