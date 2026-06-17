import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeSymbol, AssetNotFoundError } from "@/lib/analysis-service";
import { CoinMarketCapError } from "@/lib/cmc";
import { enrichAnalysisWithAi } from "@/lib/ai";
import { logServerError } from "@/lib/log";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AnalyzeSchema = z.object({
  symbol: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*$/),
  refresh: z.boolean().optional().default(true)
});

export async function POST(request: Request) {
  const { analyzeRateLimit, rateLimitWindowMs } = getServerEnv();
  const rateLimit = await checkRateLimit({
    key: getClientKey(request, "analyze"),
    limit: analyzeRateLimit,
    windowMs: rateLimitWindowMs
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many analysis requests. Try again shortly.",
        resetAt: new Date(rateLimit.resetAt).toISOString()
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
        }
      }
    );
  }

  const parsed = AnalyzeSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Enter a valid ticker, slug, or CMC ID. Example values: BTC, ETH, SOL, render-token, 1."
      },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeSymbol(parsed.data.symbol, {
      forceRefresh: parsed.data.refresh
    });
    const enriched = await enrichAnalysisWithAi(analysis);
    return NextResponse.json(enriched, {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return NextResponse.json(
        { error: "No active CoinMarketCap asset matched that ticker, slug, or CMC ID." },
        { status: 404 }
      );
    }

    if (error instanceof CoinMarketCapError) {
      return NextResponse.json(
        {
          error: getCoinMarketCapClientMessage(error),
          statusCode: error.statusCode,
          cmcCode: error.cmcCode
        },
        { status: mapCoinMarketCapStatus(error.statusCode) }
      );
    }

    logServerError("api.analyze", error);

    return NextResponse.json(
      { error: "The analysis request failed. Try again shortly." },
      { status: 500 }
    );
  }
}

function mapCoinMarketCapStatus(statusCode: number) {
  if (statusCode === 400) {
    return 400;
  }

  if (statusCode === 401 || statusCode === 403) {
    return statusCode;
  }

  if (statusCode === 429) {
    return 429;
  }

  return 502;
}

function getCoinMarketCapClientMessage(error: CoinMarketCapError) {
  if (error.statusCode === 400) {
    return "CoinMarketCap could not resolve that asset request.";
  }

  if (error.statusCode === 401 || error.statusCode === 403) {
    return "CoinMarketCap API credentials are not authorized.";
  }

  if (error.statusCode === 429) {
    return "CoinMarketCap rate limit reached. Try again shortly.";
  }

  return "CoinMarketCap did not return a usable response.";
}
