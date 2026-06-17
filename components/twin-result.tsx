"use client";

import { ArrowDownRight, ArrowUpRight, Minus, ShieldCheck } from "lucide-react";

import { SignalChart } from "@/components/signal-chart";
import {
  formatCompact,
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatPercent
} from "@/lib/format";
import type { TwinAnalysis } from "@/lib/types";

export function TwinResult({
  analysis,
  expanded = false
}: {
  analysis: TwinAnalysis;
  expanded?: boolean;
}) {
  const best = analysis.twins[0];
  const platform = analysis.currentAsset.platform;
  const onChain = analysis.currentAsset.onChainVerification;
  const freshness = analysis.sourceFreshness;
  const providerUpdatedAt = freshness.providerUpdatedAt ?? analysis.currentAsset.lastUpdated;

  return (
    <article className={expanded ? "result is-expanded" : "result"}>
      <header className="result-head">
        <div>
          <span className="mono-line">Current asset</span>
          <h2>
            {analysis.currentAsset.symbol}
            <small>{analysis.currentAsset.name}</small>
          </h2>
        </div>
        <DirectionBadge direction={analysis.expectedDirection} />
      </header>

      <div className="result-metrics">
        <Metric label="Price" value={formatCurrency(analysis.currentAsset.price)} />
        <Metric label="Market cap" value={formatCompact(analysis.currentAsset.marketCap)} />
        <Metric label="Volume 24h" value={formatCompact(analysis.currentAsset.volume24h)} />
        <Metric
          label="Chain"
          value={analysis.currentAsset.platform?.name ?? "Native asset"}
        />
        <Metric label="CMC pull" value={formatFreshnessMode(freshness.requestMode)} />
        <Metric label="Quote updated" value={formatDateTime(providerUpdatedAt)} />
        <Metric label="Cache TTL" value={formatDuration(freshness.cacheTtlSeconds)} />
        <Metric label="Confidence" value={`${analysis.confidence}%`} />
        <Metric
          label="30d samples"
          value={`${analysis.outcomeSampleSize}/${analysis.outcomeMinimumSampleSize}`}
        />
      </div>

      {platform?.tokenAddress && onChain ? (
        <div className="chain-strip">
          <span>{platform.name} token address</span>
          <code>{platform.tokenAddress}</code>
          <small>{formatOnChainStatus(onChain.status)}</small>
        </div>
      ) : null}

      {best ? (
        <div className="best-twin">
          <div>
            <span className="mono-line">Best live analogue</span>
            <h3>
              {best.asset.symbol}
              <small>{best.asset.name}</small>
            </h3>
          </div>
          <strong>{best.similarity}% similar</strong>
        </div>
      ) : null}

      <div className="analysis-grid">
        <SignalChart analysis={analysis} />
        <div className="strategy-stack">
          <p className="analysis-note">{analysis.explanation}</p>
          <div className="strategy-rules">
            {analysis.strategy.map((rule) => (
              <div key={rule.label}>
                <span>{rule.label}</span>
                <strong>{rule.value}</strong>
                <p>{rule.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {expanded && best ? (
        <div className="timeline-table">
          <div className="table-head">
            <span>Window</span>
            <span>{best.asset.symbol} rolling path</span>
          </div>
          {best.outcomes.map((outcome) => (
            <div className="table-row" key={outcome.window}>
              <span>{outcome.window}</span>
              <strong>{formatPercent(outcome.returnPct)}</strong>
            </div>
          ))}
        </div>
      ) : null}

      <footer className="result-foot">
        <ShieldCheck aria-hidden size={16} />
        <span>
          Data mode: {analysis.dataMode}. {formatFreshnessDetail(freshness)}
          Research signal only, not financial advice. Generated{" "}
          {formatDateTime(freshness.generatedAt)}.
        </span>
      </footer>
    </article>
  );
}

function formatFreshnessMode(mode: TwinAnalysis["sourceFreshness"]["requestMode"]) {
  return mode === "fresh" ? "Fresh CMC pull" : "Server cache";
}

function formatFreshnessDetail(freshness: TwinAnalysis["sourceFreshness"]) {
  if (freshness.requestMode === "fresh") {
    return "CoinMarketCap was queried for this run. ";
  }

  if (freshness.nextCachedRefreshAt) {
    return `Cached quote window refreshes after ${formatDateTime(freshness.nextCachedRefreshAt)}. `;
  }

  return "Served from the current server quote window. ";
}

function formatOnChainStatus(status: NonNullable<TwinAnalysis["currentAsset"]["onChainVerification"]>["status"]) {
  if (status === "contract-found") {
    return "On-chain contract verified by Ethereum RPC.";
  }

  if (status === "contract-not-found") {
    return "RPC checked this address but did not find deployed contract code.";
  }

  if (status === "rpc-unavailable") {
    return "RPC verification was unavailable; showing CMC metadata.";
  }

  return "CMC platform metadata; configure ETHEREUM_RPC_URL for Ethereum contract checks.";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DirectionBadge({ direction }: { direction: TwinAnalysis["expectedDirection"] }) {
  const Icon =
    direction === "Bullish" ? ArrowUpRight : direction === "Bearish" ? ArrowDownRight : Minus;

  return (
    <span className={`direction direction-${direction.toLowerCase()}`}>
      <Icon aria-hidden size={16} />
      {direction}
    </span>
  );
}
