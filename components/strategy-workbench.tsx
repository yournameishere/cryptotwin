"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { TwinResult } from "@/components/twin-result";
import type { TwinAnalysis } from "@/lib/types";

export function StrategyWorkbench() {
  const [symbol, setSymbol] = useState("");
  const [analysis, setAnalysis] = useState<TwinAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = symbol.trim();

    if (!clean) {
      setError("Enter a ticker, slug, or CMC ID before generating strategy rules.");
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
        throw new Error(payload.error ?? "Strategy request failed.");
      }

      setAnalysis(payload as TwinAnalysis);
    } catch (strategyError) {
      setError(
        strategyError instanceof Error
          ? strategyError.message
          : "Strategy request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="workbench">
      <form className="search-form" onSubmit={submit}>
        <label htmlFor="strategy-symbol">Asset ticker, slug, or CMC ID</label>
        <div className="search-row">
          <input
            id="strategy-symbol"
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder="ETH"
            value={symbol}
          />
          <button className="btn btn-primary" disabled={loading || !symbol.trim()} type="submit">
            {loading ? <Loader2 aria-hidden className="spin" size={16} /> : null}
            Generate rules
          </button>
        </div>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {analysis ? (
        <TwinResult analysis={analysis} expanded />
      ) : (
        <div className="console-empty">
          <span>No strategy yet</span>
          <p>Run an asset to convert the twin match into risk rails.</p>
        </div>
      )}
    </section>
  );
}
