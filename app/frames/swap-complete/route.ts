import { NextRequest, NextResponse } from "next/server";
import { swap } from "@/lib/enso/enso";
import { parseEther } from "viem";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const { searchParams } = url;
  const tokenFrom = searchParams.get("token_from") || "";
  const tokenTo = searchParams.get("token_to") || "";
  const amount = searchParams.get("amount") || "";
  const bigIntAmount = parseEther(amount);
  const userAddress = searchParams.get("user_address") || "";

  try {
    const txCalldata = await swap(
      tokenFrom,
      tokenTo,
      bigIntAmount.toString(),
      userAddress
    );
    console.log("Transaction calldata", txCalldata);
    return NextResponse.json(txCalldata);
  } catch (e) {
    console.log(e);
    return NextResponse.error();
  }
}
