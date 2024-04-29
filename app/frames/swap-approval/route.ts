import { TransactionTargetResponse } from "frames.js";
import { getFrameMessage } from "frames.js/next/server";
import { NextRequest, NextResponse } from "next/server";
import {
  Abi,
  createPublicClient,
  encodeFunctionData,
  getContract,
  http,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import { storageRegistryABI } from "@/lib/contracts/storage-registry";
import { CHAIN_ID, publicClient } from "@/lib/transactions";

export async function POST(
  req: NextRequest
): Promise<NextResponse<TransactionTargetResponse>> {
  const json = await req.json();

  const frameMessage = await getFrameMessage(json);

  if (!frameMessage) {
    throw new Error("No frame message");
  }

  // Get current storage price
  const units = BigInt(1);

  const calldata = encodeFunctionData({
    abi: storageRegistryABI,
    functionName: "rent",
    args: [BigInt(frameMessage.requesterFid), units],
  });

  const STORAGE_REGISTRY_ADDRESS = "0x00000000fcCe7f938e7aE6D3c335bD6a1a7c593D";

  const storageRegistry = getContract({
    address: STORAGE_REGISTRY_ADDRESS,
    abi: storageRegistryABI,
    client: publicClient,
  });

  const unitPrice = await storageRegistry.read.price([units]);

  return NextResponse.json({
    chainId: "eip155:10", // OP Mainnet 10
    method: "eth_sendTransaction",
    params: {
      abi: storageRegistryABI as Abi,
      to: STORAGE_REGISTRY_ADDRESS,
      data: calldata,
      value: unitPrice.toString(),
    },
  });
}
