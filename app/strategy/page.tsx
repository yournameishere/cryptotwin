import type { Metadata } from "next";

import { StrategyWorkbench } from "@/components/strategy-workbench";

export const metadata: Metadata = {
  title: "Strategy Generator"
};

export default function StrategyPage() {
  return (
    <main className="page page-narrow">
      <section className="route-head reveal" style={{ "--i": 0 } as React.CSSProperties}>
        <h1>Strategy generator</h1>
        <p>
          Convert a twin match into entry context, risk rails, take profit, and
          review timing.
        </p>
      </section>
      <StrategyWorkbench />
    </main>
  );
}
