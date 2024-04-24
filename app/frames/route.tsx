import { Button } from "frames.js/next";
import { frames } from "@/app/frames/frames";

const handleRequest = frames(async (ctx) => {
  const transactionType = ctx.url.searchParams.get("transaction_type");
  if (!transactionType || !["send", "swap", "mint"].includes(transactionType)) {
    return {
      image: (
        <div tw="flex flex-col">
          <div tw="flex flex-col text-center items-center align-middle">
            <p tw="text-6xl text-balance">XMTP Base Frame</p>
            <p tw="text-3xl text-balance">What can you do with this frame?</p>
          </div>
        </div>
      ),
      buttons: [
        <Button
          action="post"
          key="1"
          target="/transaction?transaction_type=send&amount=1&token=USDC"
        >
          Send
        </Button>,
        <Button
          action="post"
          key="2"
          target="/transaction?transaction_type=swap&amount_from=1&token_from=USDC&token_to=USDT"
        >
          Swap
        </Button>,
        <Button
          action="post"
          key="3"
          target="/transaction?transaction_type=mint?collection=0x123&token_id=1"
        >
          Mint
        </Button>,
      ],
    };
  }

  // send
  const amount = ctx.url.searchParams.get("amount");
  const token = ctx.url.searchParams.get("token");

  // swap
  const amountFrom = ctx.url.searchParams.get("amount_from");
  const tokenFrom = ctx.url.searchParams.get("token_from");
  const tokenTo = ctx.url.searchParams.get("token_to");

  // mint
  const collection = ctx.url.searchParams.get("collection");
  const tokenId = ctx.url.searchParams.get("token_id");

  return {
    image: (
      <div tw="flex flex-col">
        <div tw="flex text-center items-center align-middle">
          <p tw="text-6xl text-balance">Create a transaction</p>
        </div>
      </div>
    ),
    buttons: [
      <Button action="post" key="1" target="/transaction">
        Create
      </Button>,
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
