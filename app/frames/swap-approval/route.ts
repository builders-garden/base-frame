import { NextRequest, NextResponse } from "next/server";
import { approveForSwap } from "@/lib/transactions";
import { parseEther } from "viem";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const { searchParams } = url;
  const tokenFrom = searchParams.get("token_from") || "";
  const amount = searchParams.get("amount") || "";
  const bigIntAmount = parseEther(amount);

  try {
    const txCalldata = await approveForSwap(tokenFrom, bigIntAmount.toString());
    console.log("Transaction calldata", txCalldata);
    return NextResponse.json(txCalldata);
  } catch (e) {
    console.log("swap approval caused", e);
    return NextResponse.error();
  }
}
