import {
  createPublicClient,
  encodeFunctionData,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import { TOKENS } from "@/lib/tokens";
import { ENSO_ROUTER_ADDRESS, FIXED_PRICE_SALE_STRATEGY, MERKLE_MINT_SALE_STRATEGY, checkTokenDecimals } from "@/lib/utils";
import { NATIVE_TOKEN } from "@/lib/utils";
import { ERC1155_CONTRACT_ABI, ERC20_ABI, ZORA_FIXED_PRICE_STRATEGY_ABI, ZORA_MERKLE_MINT_STRATEGY_ABI } from "@/lib/abis";
import { NextResponse } from "next/server";
import { ethers } from "ethers";

export const CHAIN_ID = process.env.CHAIN_ID
  ? parseInt(process.env.CHAIN_ID)
  : 8453;

export const publicClient = createPublicClient({
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
    args: [fromAddress as `0x${string}`, ENSO_ROUTER_ADDRESS],
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
    args: [fromAddress as `0x${string}`, spenderAddress as `0x${string}`],
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
  const amountIn = parseUnits(amount, tokenInDecimals);
  const approveData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spenderAddress as `0x${string}`, amountIn],
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
  const amountIn = parseUnits(amount, tokenInDecimals);
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
  const amountIn = parseUnits(amount, tokenInDecimals);
  const transferData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [receiverAddress as `0x${string}`, amountIn],
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

// ERC1155 Zora mint function
export async function mint1155(
  collectionAddress: string,
  tokenId: string,
  fromAddress: string,
  amount?: string
) {
    let isMerkleMintStrategy;
    let valueAmount;
    // check if the collection follow the fixed price strategy 
    const isFixedPriceStrategy = await publicClient.readContract({
      address: FIXED_PRICE_SALE_STRATEGY,
      abi: ZORA_FIXED_PRICE_STRATEGY_ABI,
      functionName: "sale",
      args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
    });
    // if the collection is not following the fixed price strategy, check if it is following the markle mint strategy
    if (!isFixedPriceStrategy) {
      isMerkleMintStrategy = await publicClient.readContract({
        address: MERKLE_MINT_SALE_STRATEGY,
        abi: ZORA_MERKLE_MINT_STRATEGY_ABI,
        functionName: "sale",
        args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
      });
    }
    // if the collection is not following the markle mint strategy, throw an error
    if (!isFixedPriceStrategy && !isMerkleMintStrategy) {
      throw new Error("Zora Collection is not following a supported mint strategy");
    }
    // check mint referral address
    const mintReferralAddress = process.env.MINT_REFERRAL_ADDRESS as `0x${string}` || NATIVE_TOKEN;
    // token amount to mint
    const mintAmount = amount ? parseUnits(amount, 18) : parseUnits("1", 18);
    // if the collection is following the fixed price strategy, mint the token
    if (isFixedPriceStrategy) {
        // calculate the owner fee amount
        const fee = await publicClient.readContract({
            address: collectionAddress as `0x${string}`,
            abi: ERC1155_CONTRACT_ABI,
            functionName: "mintFee",
        });
        // calculate the token price
        const tokenPrice = isFixedPriceStrategy.pricePerToken;
        // calculate the value amount
        valueAmount = (fee + tokenPrice) * mintAmount;
        // build minter arguments
        const minterArgs = ethers.utils.defaultAbiCoder.encode(
            ["address"],
            [fromAddress as `0x${string}`]
          ) as `0x${string}`;

        const mintData = encodeFunctionData({
            abi: ERC1155_CONTRACT_ABI,
            functionName: "mintWithRewards",
            args: [
                FIXED_PRICE_SALE_STRATEGY, 
                BigInt(tokenId),
                mintAmount,
                minterArgs,
                mintReferralAddress,
            ],
        });

      return NextResponse.json({
        chainId: "eip:155:" + CHAIN_ID,
        method: "eth_sendTransaction",
        params: {
          abi: ERC1155_CONTRACT_ABI,
          to: collectionAddress,
          data: mintData,
          value: valueAmount,
        },
      });
    }

    // if the collection is following the markle mint strategy, mint the token
    if (isMerkleMintStrategy) {
        throw new Error("Merkle mint strategy not supported yet");
    }
}