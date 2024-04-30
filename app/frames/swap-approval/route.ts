import { NextRequest, NextResponse } from "next/server";
import { approveForSwap } from "@/lib/transactions";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const { searchParams } = url;
  const token = searchParams.get("token") || "";
  const amount = searchParams.get("amount") || "";

  try {
    const txCalldata = await approveForSwap(token, amount);
    console.log("Transaction calldata", txCalldata);
    return NextResponse.json(txCalldata);
  } catch (e) {
    console.log("swap approval caused", e);
    return NextResponse.error();
  }
}
