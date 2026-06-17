"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

import type { TwinAnalysis } from "@/lib/types";

export function SignalChart({ analysis }: { analysis: TwinAnalysis }) {
  const best = analysis.twins[0];
  const rows = [
    ["Volume", "volumeGrowth"],
    ["Momentum", "momentum"],
    ["Attention", "attention"],
    ["Volatility", "volatility"],
    ["Liquidity", "liquidity"],
    ["Stage", "marketCapStage"]
  ] as const;

  const data = rows.map(([label, key]) => ({
    label,
    current: Math.round(analysis.currentDna[key]),
    twin: best ? Math.round(best.dna[key]) : 0
  }));

  return (
    <div className="chart-panel" aria-label="Market DNA radar chart">
      <ResponsiveContainer height={280} width="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="var(--color-rule)" />
          <PolarAngleAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "var(--color-paper-2)",
              border: "1px solid var(--color-rule)",
              color: "var(--color-ink)"
            }}
          />
          <Radar
            dataKey="current"
            fill="var(--color-accent)"
            fillOpacity={0.18}
            name={analysis.currentAsset.symbol}
            stroke="var(--color-accent)"
            strokeWidth={2}
          />
          <Radar
            dataKey="twin"
            fill="var(--color-warning)"
            fillOpacity={0.08}
            name={best?.asset.symbol ?? "Twin"}
            stroke="var(--color-warning)"
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <table className="sr-only">
        <caption>Market DNA score comparison</caption>
        <thead>
          <tr>
            <th>Signal</th>
            <th>{analysis.currentAsset.symbol}</th>
            <th>{best?.asset.symbol ?? "Twin"}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.current}</td>
              <td>{row.twin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
