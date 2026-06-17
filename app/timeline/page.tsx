import type { Metadata } from "next";

import { TimelineWorkbench } from "@/components/timeline-workbench";

export const metadata: Metadata = {
  title: "Rolling Timeline"
};

export default function TimelinePage() {
  return (
    <main className="page page-narrow">
      <section className="route-head reveal" style={{ "--i": 0 } as React.CSSProperties}>
        <h1>Rolling timeline</h1>
        <p>
          Compare the current coin with its best twin across 7, 30, 60, and 90 day
          quote windows.
        </p>
      </section>
      <TimelineWorkbench />
    </main>
  );
}
