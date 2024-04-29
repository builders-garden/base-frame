import {
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import { TOKENS } from "./tokens";
import { ENSO_ROUTER_ADDRESS, checkTokenDecimals } from "./utils";
import { NATIVE_TOKEN } from "./utils";
import { ERC20_ABI, ERC721_ABI } from "./abis";
import { NextResponse } from "next/server";

export const CHAIN_ID = process.env.CHAIN_ID
  ? parseInt(process.env.CHAIN_ID)
  : 8453;

const publicClient = createPublicClient({
  chain: CHAIN_ID === base.id ? base : baseSepolia,
  transport: http(),
});

// Allowance for swap function
export async function allowanceForSwap(
  tokenIn: string,
  amount: string,
  fromAddress: string
) {
  let tokenInAddress = TOKENS[CHAIN_ID as number][tokenIn];
  const tokenInDecimals = await checkTokenDecimals(tokenInAddress, CHAIN_ID);
  const amountIn = parseUnits(amount, tokenInDecimals).toString();
  // if tokenIn is the native token, send the transaction directly
  if (tokenInAddress === NATIVE_TOKEN) {
    return {
      allowance: true,
    };
  }

  // get token allowance
  const allowance = (await publicClient.readContract({
    address: tokenInAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [fromAddress, ENSO_ROUTER_ADDRESS],
  })) as bigint;

  // if allowance is less than amountIn, return false
  if (BigInt(amountIn) > allowance) {
    return {
      allowance: false,
    };
  } else {
    return {
      allowance: true,
    };
  }
}

// Allowance for swap function
export async function allowance(
  tokenIn: string,
  amount: string,
  fromAddress: string,
  spenderAddress: string
) {
  let tokenInAddress = TOKENS[CHAIN_ID as number][tokenIn];
  // if tokenIn is the native token, send the transaction directly
  if (tokenInAddress === NATIVE_TOKEN) {
    return {
      allowance: true,
    };
  }

  const tokenInDecimals = await checkTokenDecimals(tokenInAddress, CHAIN_ID);
  const amountIn = parseUnits(amount, tokenInDecimals).toString();
  // get token allowance
  const allowance = (await publicClient.readContract({
    address: tokenInAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [fromAddress, spenderAddress],
  })) as bigint;

  // if allowance is less than amountIn, return false
  if (BigInt(amountIn) > allowance) {
    return {
      allowance: false,
    };
  } else {
    return {
      allowance: true,
    };
  }
}

// Approve function
export async function approve(
  tokenIn: string,
  amount: string,
  spenderAddress: string
) {
  let tokenInAddress = TOKENS[CHAIN_ID as number][tokenIn];
  // if tokenIn is the native token, send the transaction directly
  if (tokenInAddress === NATIVE_TOKEN) {
    throw new Error("Native token cannot be approved");
  }

  const tokenInDecimals = await checkTokenDecimals(tokenInAddress, CHAIN_ID);
  const amountIn = parseUnits(amount, tokenInDecimals).toString();
  const approveData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spenderAddress, amountIn],
  });

  return NextResponse.json({
    chainId: "eip:155:" + CHAIN_ID,
    method: "eth_sendTransaction",
    params: {
      abi: ERC20_ABI,
      to: tokenInAddress,
      data: approveData,
      value: "0",
    },
  });
}

// Approve for swap function
export async function approveForSwap(tokenIn: string, amount: string) {
  let tokenInAddress = TOKENS[CHAIN_ID as number][tokenIn];
  const tokenInDecimals = await checkTokenDecimals(tokenInAddress, CHAIN_ID);
  const amountIn = parseUnits(amount, tokenInDecimals).toString();
  const spenderAddress = ENSO_ROUTER_ADDRESS;
  // if tokenIn is the native token, send the transaction directly
  if (tokenInAddress === NATIVE_TOKEN) {
    throw new Error("Native token cannot be approved");
  }

  const approveData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spenderAddress, amountIn],
  });
  return NextResponse.json({
    chainId: "eip:155:" + CHAIN_ID,
    method: "eth_sendTransaction",
    params: {
      abi: ERC20_ABI,
      to: tokenInAddress,
      data: approveData,
      value: "0",
    },
  });
}

// Transfer function
export async function transfer(
  tokenIn: string,
  amount: string,
  receiverAddress: string
) {
  let tokenInAddress = TOKENS[CHAIN_ID as number][tokenIn];
  const tokenInDecimals = await checkTokenDecimals(tokenInAddress, CHAIN_ID);
  const amountIn = parseUnits(amount, tokenInDecimals).toString();
  const transferData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [receiverAddress, amountIn],
  });
  return NextResponse.json({
    chainId: "eip:155:" + CHAIN_ID,
    method: "eth_sendTransaction",
    params: {
      abi: ERC20_ABI,
      to: tokenInAddress,
      data: tokenInAddress === NATIVE_TOKEN ? "" : transferData,
      value: tokenInAddress === NATIVE_TOKEN ? amountIn : "0",
    },
  });
}

// ERC721 mint function
export async function mint721(
  tokenIn: string,
  tokenId: string,
  receiverAddress: string,
  value: string
) {
  // calculate the value amount
  let valueAmount = "0";
  if (value !== "0") {
    valueAmount = parseEther(value).toString();
  }

  const mintData = encodeFunctionData({
    abi: ERC721_ABI,
    functionName: "mint", //change to safeMint or other mint function if needed. Change the ABI accordingly
    args: [receiverAddress, tokenId],
  });

  return NextResponse.json({
    chainId: "eip:155:" + CHAIN_ID,
    method: "eth_sendTransaction",
    params: {
      abi: ERC721_ABI,
      to: tokenIn,
      data: mintData,
      value: valueAmount,
    },
  });
}
