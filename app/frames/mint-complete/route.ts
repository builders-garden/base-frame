import { NextRequest, NextResponse } from "next/server";
import { mint1155 } from "@/lib/transactions";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const { searchParams } = url;
  const collection = searchParams.get("collection") || "";
  const tokenId = searchParams.get("token_id") || "";
  const user_address = searchParams.get("user_address") || "";

  try {
    const txCalldata = await mint1155(collection, tokenId, user_address);
    console.log("Transaction mint calldata", txCalldata);
    return NextResponse.json(txCalldata);
  } catch (e) {
    console.log(e);
    return NextResponse.error();
  }
}
