import { headers } from "next/headers";
import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { ERC20_ABI } from "./abis";

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

export function vercelURL(): string {
  return process.env.VERCEL_URL
    ? `https://xmtp-base-frame.builders.garden`
    : "http://localhost:3000";
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

export async function checkTokenDecimals(
  tokenAddress: string,
  chainId: number
): Promise<number> {
  if (tokenAddress === NATIVE_TOKEN) {
    return 18;
  }

  const publicClient = createPublicClient({
    chain: chainId === base.id ? base : baseSepolia,
    transport: http(),
  });

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
function chainParser(chain: string): any {
  throw new Error("Function not implemented.");
}

export async function getTokenBalance(
  address: string,
  tokenAddress: string,
  chainId: number
) {
  const publicClient = createPublicClient({
    chain: chainId === base.id ? base : baseSepolia,
    transport: http(),
  });

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

export const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";
export const ENSO_NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const ENSO_ROUTER_ADDRESS = "0x80EbA3855878739F4710233A8a19d89Bdd2ffB8E";
