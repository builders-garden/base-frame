import { headers } from "next/headers";
import { ERC20_ABI } from "@/lib/abis";
import { CHAIN_ID, publicClient } from "@/lib/transactions";
import { TOKENS } from "@/lib/tokens";

const DEFAULT_DEBUGGER_URL =
  process.env.DEBUGGER_URL ?? "http://localhost:3010/";

export const DEFAULT_DEBUGGER_HUB_URL =
  process.env.NODE_ENV === "development"
    ? new URL("/hub", DEFAULT_DEBUGGER_URL).toString()
    : undefined;

export function currentURL(pathname: string): URL {
  const headersList = headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";

  try {
    return new URL(pathname, `${protocol}://${host}`);
  } catch (error) {
    return new URL("http://localhost:3000");
  }
}

export function vercelURL() {
  return process.env.NEXT_PUBLIC_HOST
    ? process.env.NEXT_PUBLIC_HOST
    : undefined;
}

export function appURL() {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  } else {
    const url = process.env.APP_URL || vercelURL() || "http://localhost:3000";
    return url;
  }
}

export function createDebugUrl(frameURL: string | URL): string {
  try {
    const url = new URL("/", DEFAULT_DEBUGGER_URL);

    url.searchParams.set("url", frameURL.toString());

    return url.toString();
  } catch (error) {
    return "#";
  }
}

export const FRAMES_BASE_PATH = "/transaction";

export async function checkTokenDecimals(
  tokenAddress: string
): Promise<number> {
  if (!tokenAddress) {
    throw new Error("Token address is required");
  }

  if (tokenAddress === NATIVE_TOKEN) {
    return 18;
  }

  const decimals = (await publicClient.readContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
  })) as number;

  if (isNaN(decimals)) {
    throw new Error(`Token decimals not available for address ${tokenAddress}`);
  }

  return decimals;
}

export async function getTokenBalance(address: string, token: string) {
  if (!address || !token) {
    throw new Error("Address and token are required");
  }

  const tokenAddress = TOKENS[CHAIN_ID as number][token];
  if (tokenAddress === NATIVE_TOKEN) {
    const balance = (await publicClient.getBalance({
      address: address as `0x${string}`,
    })) as bigint;

    return balance;
  }

  const balance = (await publicClient.readContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  })) as bigint;

  return balance;
}

export const NATIVE_TOKEN: `0x${string}` =
  "0x0000000000000000000000000000000000000000";
export const ENSO_NATIVE_TOKEN: `0x${string}` =
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const ENSO_ROUTER_ADDRESS: `0x${string}` =
  "0x80EbA3855878739F4710233A8a19d89Bdd2ffB8E";
export const FIXED_PRICE_SALE_STRATEGY: `0x${string}` =
  "0x04E2516A2c207E84a1839755675dfd8eF6302F0a";
export const MERKLE_MINT_SALE_STRATEGY: `0x${string}` =
  "0xf48172CA3B6068B20eE4917Eb27b5472f1f272C7";
