import { Button } from "frames.js/next";
import { frames } from "@/app/frames/frames";

export const POST = frames(async (ctx) => {
  if (!ctx?.message?.isValid) {
    console.log("Invalid Frame");
    // return {
    //   image: <div>Invalid Frame</div>,
    //   buttons: [
    //     <Button action="post" key="1" target="/who-am-i">
    //       Retry
    //     </Button>,
    //   ],
    // };
  }

  const transactionType = ctx.url.searchParams.get("transaction_type");
  const isValidTransactionType =
    transactionType && ["send", "swap", "mint"].includes(transactionType);

  // transaction not valid
  if (!isValidTransactionType) {
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
          target="/transaction?transaction_type=send"
        >
          Send
        </Button>,
        <Button
          action="post"
          key="2"
          target="/transaction?transaction_type=swap"
        >
          Swap
        </Button>,
        <Button
          action="post"
          key="3"
          target="/transaction?transaction_type=mint"
        >
          Mint
        </Button>,
      ],
    };
  }

  // swap transaction
  if (transactionType == "swap") {
    const amountFrom = ctx.url.searchParams.get("amount_from");
    const tokenFrom = ctx.url.searchParams.get("token_from");
    const tokenTo = ctx.url.searchParams.get("token_to");

    if (!amountFrom || !tokenFrom || !tokenTo) {
      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">XMTP Base Frame</p>
              <p tw="text-3xl text-balance">
                Select the tokens and the amount you want to swap
              </p>
            </div>
          </div>
        ),
        textInput: "1",
        buttons: [
          <Button
            action="post"
            key="1"
            target="/transaction?transaction_type=send"
          >
            Send
          </Button>,
          <Button
            action="post"
            key="2"
            target="/transaction?transaction_type=swap"
          >
            Swap
          </Button>,
          <Button
            action="post"
            key="3"
            target="/transaction?transaction_type=mint"
          >
            Mint
          </Button>,
        ],
      };
    }

    return {
      image: (
        <div tw="flex flex-col">
          <div tw="flex text-center items-center align-middle">
            <p tw="text-6xl text-balance">Swap</p>
            <p tw="text-3xl text-balance">
              You are swapping {amountFrom} {tokenFrom} for {tokenTo}
            </p>
          </div>
        </div>
      ),
      buttons: [
        <Button action="post" key="1" target="/">
          Home
        </Button>,
      ],
    };
  }

  // send
  const amount = ctx.url.searchParams.get("amount");
  const token = ctx.url.searchParams.get("token");

  // mint
  const collection = ctx.url.searchParams.get("collection");
  const tokenId = ctx.url.searchParams.get("token_id");

  return {
    image: (
      <div tw="flex flex-col w-full text-center items-center align-middle">
        <p tw="flex flex-col text-4xl text-center items-center align-middle">
          You are
          <span tw="text-blue-500">
            {ctx.message?.requesterCustodyAddress ||
              ctx.message?.verifiedWalletAddress}
          </span>
          from {ctx.clientProtocol?.id} and you want to do this transaction!
        </p>
      </div>
    ),
    buttons: [
      <Button action="post" key="1" target="/">
        Home
      </Button>,
    ],
  };
});
