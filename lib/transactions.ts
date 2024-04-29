
import { encodeFunctionData, erc20Abi, parseEther, parseUnits } from "viem";
import { TOKENS } from "./tokens";
import { ENSO_ROUTER_ADDRESS, checkTokenDecimals } from "./utils";
import { NATIVE_TOKEN } from "./utils";
import { ERC20_ABI, ERC721_ABI } from "./abis";
import { NextResponse } from "next/server";


// Approve function 
export async function approve(
    tokenIn: string,
    amount: string,
    spenderAddress: string
) {

    const chainId = process.env.CHAIN_ID || 8453;
    let tokenInAddress = TOKENS[chainId as number][tokenIn];
    const tokenInDecimals = await checkTokenDecimals(tokenInAddress, chainId.toString());
    const amountIn = parseUnits(amount, tokenInDecimals).toString();
    // if tokenIn is the native token, send the transaction directly
    if (tokenInAddress === NATIVE_TOKEN) {
        //return
    }

    const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spenderAddress, amountIn],
    });
    return NextResponse.json({
        chainId: "eip:155:" + chainId,
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
export async function approveForSwap(
    tokenIn: string,
    amount: string,
) {

    const chainId = process.env.CHAIN_ID || 8453;
    let tokenInAddress = TOKENS[chainId as number][tokenIn];
    const tokenInDecimals = await checkTokenDecimals(tokenInAddress, chainId.toString());
    const amountIn = parseUnits(amount, tokenInDecimals).toString();
    const spenderAddress = ENSO_ROUTER_ADDRESS
    // if tokenIn is the native token, send the transaction directly
    if (tokenInAddress === NATIVE_TOKEN) {
        //return
    }

    const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spenderAddress, amountIn],
    });
    return NextResponse.json({
        chainId: "eip:155:" + chainId,
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

    const chainId = process.env.CHAIN_ID || 8453;
    let tokenInAddress = TOKENS[chainId as number][tokenIn];
    const tokenInDecimals = await checkTokenDecimals(tokenInAddress, chainId.toString());
    const amountIn = parseUnits(amount, tokenInDecimals).toString();
    const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [receiverAddress, amountIn],
      });
    return NextResponse.json({
        chainId: "eip:155:" + chainId,
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

    return NextResponse.json({
        chainId: "eip:155:" + chainId,
        method: "eth_sendTransaction",
        params: {
          abi: ERC721_ABI,
          to: tokenIn,
          data: mintData,
          value: valueAmount,
        },
    });
}