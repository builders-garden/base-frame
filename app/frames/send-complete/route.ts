import { NextRequest, NextResponse } from "next/server";
import { transfer } from "@/lib/transactions";
import { parseEther } from "viem";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const { searchParams } = url;
  const token = searchParams.get("token") || "";
  const amount = searchParams.get("amount") || "";
  const bigIntAmount = parseEther(amount);
  const receiverAddress = searchParams.get("receiver_address") || "";

  try {
    const txCalldata = await transfer(
      token,
      bigIntAmount.toString(),
      receiverAddress
    );
    console.log("Transaction calldata", txCalldata);
    return NextResponse.json(txCalldata);
  } catch (e) {
    console.log(e);
    return NextResponse.error();
  }
}