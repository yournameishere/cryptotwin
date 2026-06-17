import Link from "next/link";

import { formatPercent } from "@/lib/format";
import type { Opportunity } from "@/lib/types";

export function OpportunityStream({
  opportunities,
  expanded = false
}: {
  opportunities: Opportunity[];
  expanded?: boolean;
}) {
  if (!opportunities.length) {
    return (
      <div className="empty-state">
        <h2>No bullish opportunities loaded</h2>
        <p>
          The live market universe did not return a positive enough twin cohort
          for this view, or live market data is temporarily unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className={expanded ? "opportunity-list is-expanded" : "opportunity-list"}>
      {opportunities.map((item, index) => (
        <Link
          className="opportunity-row"
          href={`/twins/${item.id}`}
          key={`${item.id}-${item.twinSymbol}`}
        >
          <span className="row-rank">{String(index + 1).padStart(2, "0")}</span>
          <span className="row-asset">
            <strong>{item.symbol}</strong>
            <small>{item.name}</small>
          </span>
          <span className="row-twin">
            <small>Twin</small>
            {item.twinSymbol}
          </span>
          <span className="row-score">
            <small>Similarity</small>
            {item.similarity}%
          </span>
          <span className={`row-direction row-${item.direction.toLowerCase()}`}>
            <small>Direction</small>
            {item.direction}
          </span>
          <span className="row-return">
            <small>30d path</small>
            {formatPercent(item.expectedReturn30d)}
          </span>
        </Link>
      ))}
    </div>
  );
}
