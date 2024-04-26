
import { parseUnits } from "viem";
import { TOKENS } from "../tokens";
import { ApiResponse } from "./interface";
import { checkTokenDecimals } from "../utils";
import { NATIVE_TOKEN, ENSO_NATIVE_TOKEN } from "../utils";
// Swap function 
export async function swap() {

  const chainId = process.env.CHAIN_ID || 8453;
  let tokenInAddress = TOKENS[chainId as number][tokenIn];
  const tokenOutAddress = TOKENS[chainId as number][tokenOut];
  const fee = process.env.FEE || 0;
  const feeReceiver = process.env.FEE_RECEIVER || "0x0000000000000000000000000000000000000000";
  const tokenInDecimals = await checkTokenDecimals(tokenInAddress, chainId.toString());
  const tokenOutDecimals = await checkTokenDecimals(tokenOutAddress, chainId.toString());
  const amountIn = parseUnits(amount, tokenInDecimals).toString();

  //Adjust tokenIn if it is the native token
  if (tokenInAddress === NATIVE_TOKEN) {
    tokenInAddress = ENSO_NATIVE_TOKEN;
  }

  const apiUrl = `https://api.enso.finance/api/v1/shortcuts/route?chainId=${chainId}&fromAddress=${address}&routingStrategy=router&receiver=${receiver}&spender=${address}&amountIn=${amountIn}&slippage=300&fee=${fee}&feeReceiver=${feeReceiver}&disableRFQs=false&tokenIn=${tokenInAddress}&tokenOut=${tokenOutAddress}`;
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
      fromChainId: chainId,
      fromAmount: amount,
      fromToken: tokenInAddress,,
      from: fromAddress,
      toChainId: chainId,
      toAmount: amountOut,
      toAmountMin: amountOut,
      toToken: tokenOutAddress,
      to: data.tx.to,
      value: data.tx.value,
      data: data.tx.data,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Enso: route request failed");
  }
}