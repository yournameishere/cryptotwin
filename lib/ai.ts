import "server-only";

import OpenAI from "openai";

import { getServerEnv } from "@/lib/env";
import { logServerError } from "@/lib/log";
import { buildFallbackExplanation } from "@/lib/twin-engine";
import type { TwinAnalysis } from "@/lib/types";

export async function enrichAnalysisWithAi(analysis: TwinAnalysis) {
  const { openAiApiKey, openAiModel } = getServerEnv();

  if (!openAiApiKey) {
    return analysis;
  }

  const client = new OpenAI({ apiKey: openAiApiKey });
  const best = analysis.twins[0];

  if (!best) {
    return analysis;
  }

  try {
    const response = await client.responses.create({
      model: openAiModel,
      input: [
        {
          role: "system",
          content:
            "You write concise crypto market research explanations. Do not give financial advice. Do not invent data. Use only the supplied JSON."
        },
        {
          role: "user",
          content: JSON.stringify({
            currentAsset: {
              symbol: analysis.currentAsset.symbol,
              name: analysis.currentAsset.name,
              rank: analysis.currentAsset.rank,
              platform: analysis.currentAsset.platform
            },
            bestTwin: {
              symbol: best.asset.symbol,
              name: best.asset.name,
              platform: best.asset.platform,
              similarity: best.similarity,
              drivers: best.drivers,
              outcomes: best.outcomes
            },
            confidence: analysis.confidence,
            expectedDirection: analysis.expectedDirection,
            expectedReturn30d: analysis.expectedReturn30d,
            outcomeSampleSize: analysis.outcomeSampleSize,
            outcomeMinimumSampleSize: analysis.outcomeMinimumSampleSize,
            sourceFreshness: analysis.sourceFreshness,
            strategy: analysis.strategy
          })
        }
      ],
      max_output_tokens: 220
    });

    return {
      ...analysis,
      explanation:
        response.output_text?.trim() ||
        buildFallbackExplanation(
          analysis.currentAsset,
          analysis.twins,
          analysis.expectedReturn30d
        ),
      dataMode: "live-cmc-with-ai" as const
    };
  } catch (error) {
    logServerError("openai.enrichAnalysisWithAi", error);
    return analysis;
  }
}
