import { parseUnits } from "viem";
import { ENSO_ROUTER_ABI } from "@/lib/abis";
import { TOKENS } from "@/lib/tokens";
import { ApiResponse } from "@/lib/enso/interface";
import {
  checkTokenDecimals,
  NATIVE_TOKEN,
  ENSO_NATIVE_TOKEN,
} from "@/lib/utils";
import { CHAIN_ID } from "@/lib/transactions";

// Swap function
export async function swap(
  tokenIn: string,
  tokenOut: string,
  amount: string,
  fromAddress: string
) {
  if (!tokenIn || !tokenOut || !amount || !fromAddress) {
    throw new Error("Invalid swap parameters");
  }

  let tokenInAddress = TOKENS[CHAIN_ID as number][tokenIn];
  const tokenOutAddress = TOKENS[CHAIN_ID as number][tokenOut];
  const fee = process.env.FEE || 0;
  const feeReceiver =
    process.env.FEE_RECEIVER || "0x0000000000000000000000000000000000000000";
  const tokenInDecimals = await checkTokenDecimals(tokenInAddress);
  const amountIn = parseUnits(amount, tokenInDecimals).toString();

  //Adjust tokenIn if it is the native token
  if (tokenInAddress === NATIVE_TOKEN) {
    tokenInAddress = ENSO_NATIVE_TOKEN;
  }

  const baseUrl = new URL("https://api.enso.finance/api/v1/shortcuts/route");
  baseUrl.searchParams.append("chainId", CHAIN_ID.toString());
  baseUrl.searchParams.append("fromAddress", fromAddress);
  baseUrl.searchParams.append("routingStrategy", "router");
  baseUrl.searchParams.append("receiver", fromAddress);
  baseUrl.searchParams.append("spender", fromAddress);
  baseUrl.searchParams.append("amountIn", amountIn);
  baseUrl.searchParams.append("slippage", "300");
  baseUrl.searchParams.append("fee", fee.toString());
  baseUrl.searchParams.append("feeReceiver", feeReceiver);
  baseUrl.searchParams.append("disableRFQs", "false");
  baseUrl.searchParams.append("tokenIn", tokenInAddress);
  baseUrl.searchParams.append("tokenOut", tokenOutAddress);

  const apiUrl = baseUrl.toString();
  console.log(apiUrl);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.ENSO_API_KEY}`,
      },
    });
    const data = (await response.json()) as ApiResponse;

    return {
      chainId: "eip155:".concat(CHAIN_ID.toString()),
      method: "eth_sendTransaction",
      params: {
        abi: ENSO_ROUTER_ABI,
        to: data.tx.to,
        data: data.tx.data,
        value: data.tx.value,
      },
    };
  } catch (error) {
    console.log(error);
    throw new Error("Enso: route request failed");
  }
}
