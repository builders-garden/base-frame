
import { encodeFunctionData, parseEther, parseUnits } from "viem";
import { TOKENS } from "./tokens";
import { checkTokenDecimals } from "./utils";
import { NATIVE_TOKEN } from "./utils";
import { ERC20_ABI, ERC721_ABI } from "./abis";

// Transfer function 
export async function transfer(
    tokenIn: string,
    amount: string,
    fromAddress: string,
    receiverAddress: string
) {

    const chainId = process.env.CHAIN_ID || 8453;
    let tokenInAddress = TOKENS[chainId as number][tokenIn];
    const tokenInDecimals = await checkTokenDecimals(tokenInAddress, chainId.toString());
    const amountIn = parseUnits(amount, tokenInDecimals).toString();
    const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [receiverAddress, amountIn],
      });

    return {
      chainId: chainId,
      receiver: receiverAddress,
      fromAmount: amountIn,
      fromToken: tokenInAddress,
      from: fromAddress,
      to: tokenInAddress,
      value: tokenInAddress === NATIVE_TOKEN ? amountIn : "0",
      data: tokenInAddress === NATIVE_TOKEN ? "" : transferData,
    };
}

// ERC721 mint function 
export async function mint721(
    tokenIn: string,
    tokenId: string,
    receiverAddress: string,
    fromAddress: string,
    value: string
) {
    const chainId = process.env.CHAIN_ID || 8453;
    // calculate the value amount
    let valueAmount = "0"
    if (value !== "0") {
        valueAmount = parseEther(value).toString();
    }

    const mintData = encodeFunctionData({
        abi: ERC721_ABI,
        functionName: "mint", //change to safeMint or other mint function if needed. Change the ABI accordingly
        args: [receiverAddress, tokenId],
    });

    return {
      chainId: chainId,
      receiver: receiverAddress,
      from: fromAddress,
      to: tokenIn,
      value: valueAmount,
      data: mintData,
    };
}