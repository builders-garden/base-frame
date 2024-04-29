
import { parseUnits } from "viem";
import { TOKENS } from "../tokens";
import { ApiResponse } from "./interface";
import { checkTokenDecimals } from "../utils";
import { NATIVE_TOKEN, ENSO_NATIVE_TOKEN } from "../utils";

// Swap function 
export async function swap(
  tokenIn: string,
  tokenOut: string,
  amount: string,
  fromAddress: string
) {

  const chainId = process.env.CHAIN_ID || 8453;
  let tokenInAddress = TOKENS[chainId as number][tokenIn];
  const tokenOutAddress = TOKENS[chainId as number][tokenOut];
  const fee = process.env.FEE || 0;
  const feeReceiver = process.env.FEE_RECEIVER || "0x0000000000000000000000000000000000000000";
  const tokenInDecimals = await checkTokenDecimals(tokenInAddress, chainId.toString());
  const amountIn = parseUnits(amount, tokenInDecimals).toString();

  //Adjust tokenIn if it is the native token
  if (tokenInAddress === NATIVE_TOKEN) {
    tokenInAddress = ENSO_NATIVE_TOKEN;
  }

  const baseUrl = new URL("https://api.enso.finance/api/v1/shortcuts/route");
  baseUrl.searchParams.append("chainId", chainId.toString())
  baseUrl.searchParams.append("fromAddress", fromAddress)
  baseUrl.searchParams.append("routingStrategy", "router")
  baseUrl.searchParams.append("receiver", fromAddress)
  baseUrl.searchParams.append("spender", fromAddress)
  baseUrl.searchParams.append("amountIn", amountIn)
  baseUrl.searchParams.append("slippage", "300")
  baseUrl.searchParams.append("fee", fee.toString())
  baseUrl.searchParams.append("feeReceiver", feeReceiver)
  baseUrl.searchParams.append("disableRFQs", "false")
  baseUrl.searchParams.append("tokenIn", tokenInAddress)
  baseUrl.searchParams.append("tokenOut", tokenOutAddress)

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
    console.log(data, "data");

    return {
      chainId: chainId,
      receiver: fromAddress,
      fromAmount: amountIn,
      fromToken: tokenInAddress,
      toAmount: data.amountOut,
      toToken: tokenOutAddress,
      from: fromAddress,
      to: data.tx.to,
      value: data.tx.value,
      data: data.tx.data,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Enso: route request failed");
  }
}