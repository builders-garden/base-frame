import { headers } from "next/headers";
import { createPublicClient, http } from "viem";
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
    ? `https://stringz.builders.garden`
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
  chain: string
): Promise<number> {
  if (tokenAddress === NATIVE_TOKEN) {
    return 18;
  }

  const publicClient = createPublicClient({
    chain: chainParser(chain),
    transport: http(),
  });

  const decimals = (await publicClient.readContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
  })) as number;

  if (isNaN(decimals)) {
    throw new Error(
      `Token decimals not available for address ${tokenAddress}`
    );
  }

  return decimals;
}
function chainParser(chain: string): any {
  throw new Error("Function not implemented.");
}

export const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000"
export const ENSO_NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"