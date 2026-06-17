"use client";

import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { TwinResult } from "@/components/twin-result";
import type { TwinAnalysis } from "@/lib/types";

export function TwinConsole({
  initialSymbol = "",
  compact = false
}: {
  initialSymbol?: string;
  compact?: boolean;
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [analysis, setAnalysis] = useState<TwinAnalysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runAnalysis(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const clean = symbol.trim();

    if (!clean) {
      setError("Enter a ticker, slug, or CMC ID before running analysis.");
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
        throw new Error(payload.error ?? "The analysis request failed.");
      }

      setAnalysis(payload as TwinAnalysis);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The analysis request failed."
      );
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className={compact ? "console is-compact" : "console"}
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <form className="search-form" onSubmit={runAnalysis}>
        <label htmlFor={compact ? "asset-compact" : "asset"}>Asset ticker, slug, or CMC ID</label>
        <div className="search-row">
          <Search aria-hidden size={18} />
          <input
            aria-describedby="asset-help"
            autoComplete="off"
            id={compact ? "asset-compact" : "asset"}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder="BTC"
            value={symbol}
          />
          <button className="btn btn-primary" disabled={loading || !symbol.trim()} type="submit">
            {loading ? (
              <>
                <Loader2 aria-hidden className="spin" size={16} />
                Reading
              </>
            ) : (
              "Find twin"
            )}
          </button>
        </div>
        <p id="asset-help">
          Full reports use CoinMarketCap IDs to avoid ambiguous tickers.
        </p>
      </form>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      {analysis ? (
        <>
          <TwinResult analysis={analysis} />
          <Link className="text-link" href={`/twins/${analysis.currentAsset.id}`}>
            Open full report
          </Link>
        </>
      ) : (
        <div className="console-empty">
          <span>Waiting for market DNA</span>
          <p>
            Run an asset to see similarity, confidence, outcome windows, and
            strategy rails.
          </p>
        </div>
      )}
    </motion.section>
  );
}
