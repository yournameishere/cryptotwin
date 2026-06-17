import { NextResponse } from "next/server";

import { getOpportunitySet } from "@/lib/analysis-service";
import { CoinMarketCapError } from "@/lib/cmc";
import { logServerError } from "@/lib/log";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit({
    key: getClientKey(request, "opportunities"),
    limit: 60,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many opportunity requests. Try again shortly.",
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

  try {
    return NextResponse.json(await getOpportunitySet());
  } catch (error) {
    if (error instanceof CoinMarketCapError) {
      return NextResponse.json(
        {
          error: getCoinMarketCapClientMessage(error),
          statusCode: error.statusCode
        },
        { status: mapCoinMarketCapStatus(error.statusCode) }
      );
    }

    logServerError("api.opportunities", error);

    return NextResponse.json(
      { error: "Could not load live opportunities." },
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
    return "CoinMarketCap could not resolve the opportunity universe.";
  }

  if (error.statusCode === 401 || error.statusCode === 403) {
    return "CoinMarketCap API credentials are not authorized.";
  }

  if (error.statusCode === 429) {
    return "CoinMarketCap rate limit reached. Try again shortly.";
  }

  return "CoinMarketCap did not return a usable response.";
}
