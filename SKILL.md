---
name: cryptotwin-ai-agent
description: "Use when working on the CryptoTwin AI codebase: auditing, fixing, extending, testing, documenting, or preparing the Next.js crypto market twin app for production. Covers live CoinMarketCap data, optional OpenAI explanations, optional Ethereum RPC checks, live-data-only rules, risk-copy constraints, UI QA, and release verification."
---

# CryptoTwin AI Agent Skill

## Operating Rules

- Preserve the app's core promise: live market DNA comparison for crypto research.
- Do not add synthetic market rows, invented metrics, fabricated testimonials, fabricated backtests, or fixed "winner" examples.
- Do not claim historical twin/backtest behavior unless a real historical snapshot store is implemented and used by the engine.
- Treat every output as research, not financial advice.
- Keep API keys server-only. Never expose `COINMARKETCAP_API_KEY`, `OPENAI_API_KEY`, or RPC URLs to client components.
- Prefer fixing the data flow over masking issues with copy.
- Keep UI changes consistent with `tokens.css` and `app/globals.css`.

## Project Map

- `app/api/analyze/route.ts` - single-symbol analysis endpoint.
- `app/api/opportunities/route.ts` - ranked bullish opportunity endpoint.
- `lib/cmc.ts` - CoinMarketCap client, parsing, retry, cache.
- `lib/twin-engine.ts` - DNA extraction, similarity scoring, direction, strategy rules.
- `lib/analysis-service.ts` - market universe orchestration and symbol resolution.
- `lib/ai.ts` - optional OpenAI explanation layer.
- `lib/onchain.ts` - optional Ethereum RPC contract verification.
- `components/twin-result.tsx` - report UI and provenance/freshness display.
- `components/twin-console.tsx` - main analysis form.
- `tests/` - deterministic unit tests for engine and infrastructure behavior.

## Data Integrity Checklist

Before shipping market-related changes:

1. Confirm every displayed token/price/rank/return comes from CoinMarketCap, RPC verification, or computed analysis.
2. If a value can be missing, display a neutral state such as `--` or an explicit unavailable message.
3. Keep `expectedDirection` tied to real cohort return thresholds.
4. Do not show a long-side take profit when the matched cohort is neutral, bearish, or missing enough 30-day data.
5. Keep source wording honest: "live analogue" for current-universe matches; "historical analogue" only for stored historical snapshots.

## API Safety Checklist

- Validate input with Zod.
- Rate-limit public endpoints.
- Map client errors to `400` or `404`, provider throttling to `429`, auth failures to `401/403`, and true upstream failures to `502`.
- Do not echo raw internal error messages to API clients.
- Log sanitized server errors with context and timestamp.
- Keep expensive provider calls in server-only modules.

## UI Checklist

- Main routes must load without framework overlays.
- Analyze flow must work from a blank input.
- Mobile widths must not horizontally overflow, including long token addresses.
- Charts need text equivalents for screen readers.
- Footer must expose risk and privacy pages.
- Use concise product copy. Do not over-explain implementation details inside the app UI.

## Verification Commands

Run these before handing off:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm audit --json
```

For live verification with configured env vars:

```bash
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/api/opportunities
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/api/analyze -Method Post -ContentType "application/json" -Body '{"symbol":"BTC"}'
```

If Next chooses another port, use that port consistently.

## Documentation Updates

Update `README.md` whenever any of these change:

- Env vars
- Routes
- API response behavior
- Data source or data scope
- Security/rate-limit posture
- Test/build commands
- On-chain verification capabilities

## Common Pitfalls

- CoinMarketCap rolling quote windows are not the same as a historical backtest.
- CMC platform metadata is not the same as full on-chain verification.
- In-memory rate limits and caches reset per server process.
- Serverless filesystems are not durable storage for historical snapshots.
- OpenAI output must explain supplied JSON only; it must not invent market facts.
