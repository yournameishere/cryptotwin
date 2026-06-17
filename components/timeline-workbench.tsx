"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { formatPercent } from "@/lib/format";
import type { TwinAnalysis } from "@/lib/types";

export function TimelineWorkbench() {
  const [symbol, setSymbol] = useState("");
  const [analysis, setAnalysis] = useState<TwinAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = symbol.trim();

    if (!clean) {
      setError("Enter a ticker, slug, or CMC ID before building a timeline.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: clean })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Timeline request failed.");
      }

      setAnalysis(payload as TwinAnalysis);
    } catch (timelineError) {
      setError(
        timelineError instanceof Error
          ? timelineError.message
          : "Timeline request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  const best = analysis?.twins[0];
  const chartData = best?.outcomes.map((outcome) => ({
    window: outcome.window,
    twinReturn: outcome.returnPct
  }));

  return (
    <section className="workbench">
      <form className="search-form" onSubmit={submit}>
        <label htmlFor="timeline-symbol">Asset ticker, slug, or CMC ID</label>
        <div className="search-row">
          <input
            id="timeline-symbol"
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder="BTC"
            value={symbol}
          />
          <button className="btn btn-primary" disabled={loading || !symbol.trim()} type="submit">
            {loading ? <Loader2 aria-hidden className="spin" size={16} /> : null}
            Build timeline
          </button>
        </div>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {analysis && best && chartData ? (
        <div className="timeline-panel">
          <div>
            <span className="mono-line">Match path</span>
            <h2>
              {analysis.currentAsset.symbol} matches {best.asset.symbol}
            </h2>
            <p>
              Best twin similarity is {best.similarity}%. The chart shows the
              matched asset rolling returns from live CMC quote windows.
            </p>
          </div>
          <ResponsiveContainer height={320} width="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="var(--color-rule)" vertical={false} />
              <XAxis dataKey="window" stroke="var(--color-muted)" />
              <YAxis stroke="var(--color-muted)" tickFormatter={(value) => `${value}%`} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-paper-2)",
                  border: "1px solid var(--color-rule)",
                  color: "var(--color-ink)"
                }}
                formatter={(value) =>
                  typeof value === "number" ? formatPercent(value) : "--"
                }
              />
              <Line
                dataKey="twinReturn"
                dot={{ r: 4, fill: "var(--color-accent)" }}
                name={`${best.asset.symbol} return`}
                stroke="var(--color-accent)"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
          <table className="sr-only">
            <caption>{best.asset.symbol} rolling return windows</caption>
            <thead>
              <tr>
                <th>Window</th>
                <th>Return</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.window}>
                  <td>{row.window}</td>
                  <td>{formatPercent(row.twinReturn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="console-empty">
          <span>No timeline yet</span>
          <p>Run an asset to build a live twin path.</p>
        </div>
      )}
    </section>
  );
}
