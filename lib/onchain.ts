import "server-only";

import { getServerEnv } from "@/lib/env";
import type { MarketAsset } from "@/lib/types";

const EVM_ETHEREUM_NAMES = new Set(["ethereum", "eth"]);

export async function enrichAssetOnChain(asset: MarketAsset): Promise<MarketAsset> {
  const verification = asset.onChainVerification;
  const { ethereumRpcUrl } = getServerEnv();

  if (!verification || !ethereumRpcUrl || !isEthereumPlatform(verification.network)) {
    return asset;
  }

  try {
    const response = await fetch(ethereumRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_getCode",
        params: [verification.address, "latest"]
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Ethereum RPC returned ${response.status}.`);
    }

    const payload = (await response.json().catch(() => null)) as
      | { result?: string; error?: unknown }
      | null;

    if (!payload || payload.error || typeof payload.result !== "string") {
      throw new Error("Ethereum RPC did not return contract code.");
    }

    const code = payload?.result;

    return {
      ...asset,
      onChainVerification: {
        ...verification,
        status: code && code !== "0x" ? "contract-found" : "contract-not-found",
        source: "rpc",
        checkedAt: new Date().toISOString()
      }
    };
  } catch {
    return {
      ...asset,
      onChainVerification: {
        ...verification,
        status: "rpc-unavailable",
        source: "rpc",
        checkedAt: new Date().toISOString()
      }
    };
  }
}

function isEthereumPlatform(platform: string) {
  return EVM_ETHEREUM_NAMES.has(platform.trim().toLowerCase());
}
