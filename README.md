# CryptoTwin AI

CryptoTwin AI is a live crypto research app that answers one question:

> Which active market asset currently looks most like this coin?

The app does not ship prebuilt token rows or browser-side secrets. It resolves a user-entered ticker, slug, or CoinMarketCap ID through CoinMarketCap, builds a live market DNA profile, compares that profile against the configured CMC universe, and returns the closest twins with confidence, rolling outcome windows, outcome sample counts, chain metadata, source freshness, and strategy rails. OpenAI enrichment is optional and only uses the JSON produced by the live analysis engine.

This is research software, not financial advice.

## What It Does

- Resolves tickers, slugs, and stable CoinMarketCap asset IDs.
- Pulls live CoinMarketCap Pro quote data from server-side routes for the configured top market-cap universe.
- Extracts a market DNA profile from volume intensity, momentum windows, attention proxy, volatility, liquidity, and market-cap stage.
- Finds the closest live twins using a weighted distance model.
- Shows confidence, expected direction, rolling 7/30/60/90 day windows, 30 day outcome sample counts, chain/platform metadata, and token addresses when CoinMarketCap provides them.
- Optionally verifies Ethereum token contracts with `ETHEREUM_RPC_URL`.
- Rate-limits public API routes to reduce accidental quota burn and abuse, with optional Upstash Redis REST storage for multi-instance production deployments.
- Generates strategy rules for entry context, long target status, stop loss, and review window.
- Uses OpenAI to explain the result when `OPENAI_API_KEY` is configured; otherwise it falls back to a deterministic server explanation.
- Provides risk and privacy pages for production trust.

## Architecture

```text
Browser UI
  |
  | POST /api/analyze
  | GET  /api/opportunities
  v
Next.js server routes
  |
  v
Analysis service
  |
  +-- CoinMarketCap adapter
  |     - listings/latest
  |     - cryptocurrency/map
  |     - quotes/latest
  |
  +-- Twin engine
  |     - DNA extraction
  |     - weighted similarity scoring
  |     - cohort outcome reading
  |     - strategy rule generation
  |
  +-- OpenAI enrichment
  |     - concise explanation from supplied JSON only
  |
  +-- Optional Ethereum RPC check
        - eth_getCode contract existence verification
  |
  +-- Optional durable rate limit store
        - Upstash Redis REST when configured
```

## Main Files

- `app/page.tsx` - home workbench and live opportunity stream.
- `app/discover/page.tsx` - interactive twin discovery.
- `app/opportunities/page.tsx` - ranked live opportunity list.
- `app/timeline/page.tsx` - rolling outcome chart for the best twin.
- `app/strategy/page.tsx` - strategy-rule workbench.
- `app/methodology/page.tsx` - user-facing explanation of the engine.
- `app/risk/page.tsx` - risk disclosure.
- `app/privacy/page.tsx` - privacy summary.
- `app/twins/[symbol]/page.tsx` - shareable full twin report.
- `app/api/analyze/route.ts` - server route for one asset analysis.
- `app/api/opportunities/route.ts` - server route for ranked opportunities.
- `lib/cmc.ts` - CoinMarketCap client, retries, validation, and short-lived cache.
- `lib/twin-engine.ts` - DNA extraction, matching, expected direction, and strategy rules.
- `lib/ai.ts` - optional OpenAI explanation layer.
- `lib/onchain.ts` - optional Ethereum RPC contract-code verification.
- `lib/rate-limit.ts` - request limiting with optional Upstash Redis REST storage and local in-memory fallback.
- `components/*` - UI workbenches, result views, charts, and shell navigation.
- `SKILL.md` - project-specific operating guide for future coding agents.

## Data Flow

1. A user enters a ticker, slug, or CoinMarketCap ID.
2. The server loads the configured CMC market universe.
3. If the asset is not already in the universe, the server resolves it by stable ID, symbol map lookup, or active slug/name map lookup, then fetches quotes by ID.
4. The engine converts each asset into a normalized DNA vector.
5. The target asset is compared against candidates with weighted distance scoring.
6. The top twins produce similarity, confidence, direction, rolling paths, outcome sample counts, and strategy rules.
7. The current asset can be enriched with Ethereum RPC contract-code verification when configured.
8. The UI renders the result with data mode, quote freshness, report time, and chain metadata.
9. If OpenAI is configured, the server asks for a concise explanation using only the supplied live analysis JSON and sample counts.

## Environment

Create `.env.local` from `.env.example`:

```bash
COINMARKETCAP_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
ETHEREUM_RPC_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
MARKET_UNIVERSE_LIMIT=500
OPPORTUNITY_SCAN_LIMIT=120
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RATE_LIMIT_KEY_SALT=
```

Required:

- `COINMARKETCAP_API_KEY` - used only on the server for live CMC data.

Optional:

- `OPENAI_API_KEY` - enables AI-written research explanations.
- `OPENAI_MODEL` - defaults to `gpt-4.1-mini`.
- `ETHEREUM_RPC_URL` - enables Ethereum `eth_getCode` checks for token contracts.
- `NEXT_PUBLIC_APP_URL` - public base URL for deployment metadata or future sharing flows.
- `MARKET_UNIVERSE_LIMIT` - CMC listings loaded for matching, default `500`, clamped between `20` and `5000`.
- `OPPORTUNITY_SCAN_LIMIT` - leading assets scanned for the opportunities list, default `120`, clamped between `20` and `500`.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` - optional durable rate-limit store for multi-instance production deployments.
- `RATE_LIMIT_KEY_SALT` - optional salt used when hashing rate-limit client identifiers.

Never expose these keys in client components. The current implementation reads secrets through server-only modules.

On Vercel, `NEXT_PUBLIC_APP_URL` can be omitted unless you have a custom domain.
The app falls back to Vercel's production or preview URL system environment
variables for metadata, sitemap, robots, and social cards.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

If another process already uses port 3000, Next.js may choose the next available port.

## Production Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run start
```

## Vercel Deployment

The app is Vercel-ready as a standard Next.js project. Before production deploys,
configure at least `COINMARKETCAP_API_KEY`. Configure `OPENAI_API_KEY` and
`OPENAI_MODEL` when AI explanations should be enabled. Optional deploy-time
variables include `ETHEREUM_RPC_URL`, `MARKET_UNIVERSE_LIMIT`,
`OPPORTUNITY_SCAN_LIMIT`, `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, and `RATE_LIMIT_KEY_SALT`.

Production metadata includes SVG favicon/app icons, a web manifest, sitemap,
robots rules, and generated Open Graph/Twitter images.

## Routes

- `/` - main workbench and live opportunity preview.
- `/discover` - single-asset twin discovery.
- `/opportunities` - ranked live market opportunities.
- `/timeline` - best-twin rolling return chart.
- `/strategy` - strategy rule generator.
- `/methodology` - how the engine works.
- `/risk` - risk disclosure.
- `/privacy` - privacy summary.
- `/twins/[asset]` - full report for one asset. Generated links use the stable CMC asset ID.

## API Routes

### `POST /api/analyze`

Request:

```json
{
  "symbol": "BTC"
}
```

Response:

- Current asset quote data.
- Stable current asset CMC ID for shareable report links.
- Current DNA profile.
- Top twin matches.
- Expected direction and confidence.
- 30 day outcome sample count and required minimum sample count.
- Strategy rules.
- Quote freshness and report generation time.
- Chain/platform metadata and optional Ethereum RPC verification status.
- Live CMC/OpenAI data mode.

### `GET /api/opportunities`

Response:

- Ranked live opportunities from the configured CMC universe.
- Bullish-only candidates with stable CMC ID, best twin, similarity, direction, confidence, and 30 day path.

## Production Notes

- API keys are server-only and ignored by git through `.env.local`.
- CoinMarketCap requests use the `X-CMC_PRO_API_KEY` header.
- CMC responses are cached briefly in memory to reduce duplicate calls during one server process.
- CMC calls retry transient failures and surface API errors through server routes.
- Public API routes use hashed client identifiers. Configure Upstash Redis REST for durable multi-instance rate limits; otherwise the app falls back to local in-memory limits for development and single-process deployments.
- Security headers are configured in `next.config.ts`.
- The engine treats zero values as valid market data, not missing data.
- Long-side strategy targets are inactive when the matched cohort is neutral, bearish, or has fewer than two valid 30 day outcome samples.
- The UI initializes analysis forms blank so every result is intentionally run against live data.
- Shareable report links use stable CMC asset IDs instead of symbols to avoid duplicate ticker collisions.
- Error pages avoid exposing raw internal exception messages.
- OpenAI failures fall back to deterministic explanations and are logged server-side.

## Current Scope

CryptoTwin AI currently uses a configured top CoinMarketCap market-cap universe and rolling quote windows. The default universe is `500` listings and the default opportunity scan is `120` leading assets; tune these with `MARKET_UNIVERSE_LIMIT` and `OPPORTUNITY_SCAN_LIMIT` based on your CMC plan. Matches are live analogues, not complete historical backtests.

The matching boundary is isolated in `lib/twin-engine.ts`, so a future historical snapshot warehouse can be added without replacing the UI or API routes. Do not describe a match as a historical analogue until that real snapshot store exists and is queried by the engine.

## Agent Guidance

Future coding agents should read `SKILL.md` before making production changes. It captures the live-data-only rules, market-data integrity checks, API safety rules, UI QA checklist, and verification commands for this app.

The app should be deployed only with valid production environment variables and a CoinMarketCap plan that supports the required endpoints.
