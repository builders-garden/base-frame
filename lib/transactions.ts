import { utils } from "ethers";
import { createPublicClient, encodeFunctionData, http, parseUnits } from "viem";
import { base, baseSepolia } from "viem/chains";
import { TOKENS } from "@/lib/tokens";
import {
  ENSO_ROUTER_ADDRESS,
  FIXED_PRICE_SALE_STRATEGY,
  MERKLE_MINT_SALE_STRATEGY,
  checkTokenDecimals,
  NATIVE_TOKEN,
} from "@/lib/utils";
import {
  ERC1155_CONTRACT_ABI,
  ERC20_ABI,
  ZORA_FIXED_PRICE_STRATEGY_ABI,
  ZORA_MERKLE_MINT_STRATEGY_ABI,
} from "@/lib/abis";

export const CHAIN_ID = process.env.CHAIN_ID
  ? parseInt(process.env.CHAIN_ID)
  : 8453;

export const publicClient = createPublicClient({
  chain: CHAIN_ID === base.id ? base : baseSepolia,
  transport: http(),
});

// Allowance for send function
export async function allowance(
  tokenIn: string,
  amount: string,
  fromAddress: string,
  spenderAddress: string
) {
  if (!tokenIn || !amount || !fromAddress || !spenderAddress) {
    throw new Error("Invalid allowance parameters");
  }

  let tokenInAddress = TOKENS[CHAIN_ID as number][tokenIn];
  // if tokenIn is the native token, send the transaction directly
  if (tokenInAddress === NATIVE_TOKEN) {
    return {
      allowance: true,
    };
  }

  const tokenInDecimals = await checkTokenDecimals(tokenInAddress);
  const amountIn = parseUnits(amount, tokenInDecimals);
  // get token allowance
  const allowance = (await publicClient.readContract({
    address: tokenInAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [fromAddress as `0x${string}`, spenderAddress as `0x${string}`],
  })) as bigint;

  // if allowance is less than amountIn, return false
  if (amountIn > allowance) {
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
export async function allowanceForSwap(
  tokenIn: string,
  amount: string,
  fromAddress: string
) {
  return allowance(tokenIn, amount, fromAddress, ENSO_ROUTER_ADDRESS);
}

// Approve function
export async function approve(
  tokenIn: string,
  amount: string,
  spenderAddress: string
) {
  if (!tokenIn || !amount || !spenderAddress) {
    throw new Error("Invalid approve parameters");
  }

  let tokenInAddress = TOKENS[CHAIN_ID as number][tokenIn];
  // if tokenIn is the native token, send the transaction directly
  if (tokenInAddress === NATIVE_TOKEN) {
    throw new Error("Native token cannot be approved");
  }

  const tokenInDecimals = await checkTokenDecimals(tokenInAddress);
  const amountIn = parseUnits(amount, tokenInDecimals);
  const approveData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spenderAddress as `0x${string}`, amountIn],
  });

  return {
    chainId: "eip155:".concat(CHAIN_ID.toString()),
    method: "eth_sendTransaction",
    params: {
      abi: ERC20_ABI,
      to: tokenInAddress,
      data: approveData,
      value: "0",
    },
  };
}

// Approve for swap function
export async function approveForSwap(tokenIn: string, amount: string) {
  return approve(tokenIn, amount, ENSO_ROUTER_ADDRESS);
}

// Transfer function
export async function transfer(
  tokenIn: string,
  amount: string,
  receiverAddress: string
) {
  if (!tokenIn || !amount || !receiverAddress) {
    throw new Error("Invalid transfer parameters");
  }

  let tokenInAddress = TOKENS[CHAIN_ID as number][tokenIn];
  const tokenInDecimals = await checkTokenDecimals(tokenInAddress);
  const amountIn = parseUnits(amount, tokenInDecimals);

  const transferData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [receiverAddress as `0x${string}`, BigInt(amountIn)],
  });

  return {
    chainId: "eip155:".concat(CHAIN_ID.toString()),
    method: "eth_sendTransaction",
    params: {
      abi: ERC20_ABI,
      to: tokenInAddress === NATIVE_TOKEN ? receiverAddress : tokenInAddress,
      data: tokenInAddress === NATIVE_TOKEN ? "" : transferData,
      value: tokenInAddress === NATIVE_TOKEN ? amountIn.toString() : "0",
    },
  };
}

export async function isFixedPriceMintStrategy(
  collectionAddress: string,
  tokenId: string,
  amount?: string
) {
  let merkleMintStrategy;
  const fixedPriceStrategy = await publicClient.readContract({
    address: FIXED_PRICE_SALE_STRATEGY,
    abi: ZORA_FIXED_PRICE_STRATEGY_ABI,
    functionName: "sale",
    args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
  });
  // check if the collection is following the fixed price strategy
  const isFixedPriceStrategy = fixedPriceStrategy.pricePerToken !== BigInt(0);
  if (isFixedPriceStrategy) {
    // calculate the owner fee amount
    const fee = await publicClient.readContract({
      address: collectionAddress as `0x${string}`,
      abi: ERC1155_CONTRACT_ABI,
      functionName: "mintFee",
    });
    // calculate the token price
    const tokenPrice = fixedPriceStrategy.pricePerToken;
    // calculate the value amount
    const mintAmount = amount ? BigInt(amount) : BigInt("1");
    const valueAmount = (fee + tokenPrice) * mintAmount;
    return { isFixedPriceStrategy: true, nftPrice: valueAmount };
  }

  // if the collection is not following the fixed price strategy, check if it is following the markle mint strategy
  merkleMintStrategy = await publicClient.readContract({
    address: MERKLE_MINT_SALE_STRATEGY,
    abi: ZORA_MERKLE_MINT_STRATEGY_ABI,
    functionName: "sale",
    args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
  });

  // check if the collection is following the markle mint strategy
  const isMerkleMintStrategy = merkleMintStrategy?.merkleRoot !== NATIVE_TOKEN;
  if (isMerkleMintStrategy) {
    console.error("Merkle mint strategy not supported yet");
    return { isFixedPriceStrategy: false, nftPrice: BigInt(0) };
  }
  // if the collection is not following the markle mint strategy, throw an error
  if (!isFixedPriceStrategy && !isMerkleMintStrategy) {
    throw new Error(
      "Zora Collection is not following a supported mint strategy"
    );
  }
}

// ERC1155 Zora mint function
export async function mint1155(
  collectionAddress: string,
  tokenId: string,
  fromAddress: string,
  amount?: string
) {
  if (!collectionAddress || !tokenId || !fromAddress) {
    throw new Error("Invalid mint parameters");
  }

  let merkleMintStrategy;
  let valueAmount: bigint;
  // check if the collection follow the fixed price strategy
  const fixedPriceStrategy = await publicClient.readContract({
    address: FIXED_PRICE_SALE_STRATEGY,
    abi: ZORA_FIXED_PRICE_STRATEGY_ABI,
    functionName: "sale",
    args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
  });
  // check if the collection is following the fixed price strategy
  const isFixedPriceStrategy = fixedPriceStrategy.pricePerToken !== BigInt(0);
  // if the collection is not following the fixed price strategy, check if it is following the markle mint strategy
  if (!isFixedPriceStrategy) {
    merkleMintStrategy = await publicClient.readContract({
      address: MERKLE_MINT_SALE_STRATEGY,
      abi: ZORA_MERKLE_MINT_STRATEGY_ABI,
      functionName: "sale",
      args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
    });
  }
  // check if the collection is following the markle mint strategy
  const isMerkleMintStrategy = merkleMintStrategy?.merkleRoot !== NATIVE_TOKEN;

  // if the collection is not following the markle mint strategy, throw an error
  if (!isFixedPriceStrategy && !isMerkleMintStrategy) {
    throw new Error(
      "Zora Collection is not following a supported mint strategy"
    );
  }

  // token amount to mint
  const mintAmount = amount ? BigInt(amount) : BigInt("1");
  // if the collection is following the fixed price strategy, mint the token
  if (isFixedPriceStrategy) {
    // calculate the owner fee amount
    const fee = await publicClient.readContract({
      address: collectionAddress as `0x${string}`,
      abi: ERC1155_CONTRACT_ABI,
      functionName: "mintFee",
    });
    // calculate the token price
    const tokenPrice = fixedPriceStrategy.pricePerToken;
    // calculate the value amount
    valueAmount = (fee + tokenPrice) * mintAmount;
    // build minter arguments
    const minterArgs = utils.defaultAbiCoder.encode(
      ["address"],
      [fromAddress as `0x${string}`]
    ) as string;

    const mintData = encodeFunctionData({
      abi: ERC1155_CONTRACT_ABI,
      functionName: "mintWithRewards",
      args: [
        FIXED_PRICE_SALE_STRATEGY,
        BigInt(tokenId),
        mintAmount,
        minterArgs as `0x${string}`,
        process.env.ZORA_REFERRAL_ADDRESS
          ? (process.env.ZORA_REFERRAL_ADDRESS as `0x${string}`)
          : NATIVE_TOKEN,
      ],
    });

    return {
      chainId: "eip155:".concat(CHAIN_ID.toString()),
      method: "eth_sendTransaction",
      params: {
        abi: ERC1155_CONTRACT_ABI,
        to: collectionAddress as `0x${string}`,
        data: mintData,
        value: valueAmount.toString(),
      },
    };
  }
}
