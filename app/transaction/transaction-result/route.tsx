import { Button } from "frames.js/next";
import { frames } from "@/app/transaction/frames";
import { publicClient } from "@/lib/transactions";

const handler = frames(async (ctx) => {
  if (!ctx?.message?.isValid) {
    console.log("Invalid Frame");
  }

  const transactionType = ctx.url.searchParams.get("transaction_type");
  const isValidTransactionType =
    !!transactionType && ["send", "swap", "mint"].includes(transactionType);

  const transactionId = ctx.message?.transactionId;

  // transaction_type not valid
  if (!isValidTransactionType || !transactionId) {
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
          target="/transaction?transaction_type=swap"
        >
          Swap
        </Button>,
        <Button
          action="post"
          key="2"
          target="/transaction?transaction_type=send"
        >
          Send
        </Button>,
        <Button
          action="post"
          key="3"
          target="/transaction?transaction_type=mint"
        >
          Mint
        </Button>,
        <Button action="post" key="4" target="/info">
          Learn More
        </Button>,
      ],
    };
  }

  let transactionReceipt: any = null;
  try {
    transactionReceipt = await publicClient.getTransactionReceipt({
      hash: transactionId as `0x${string}`,
    });
  } catch (e) {
    console.error(e);
  }

  if (!transactionReceipt) {
    return {
      image: (
        <div tw="flex flex-col">
          <div tw="flex flex-col text-center items-center align-middle">
            <p tw="text-6xl text-balance">XMTP Base Frame</p>
            <p tw="text-4xl text-balance">Processing</p>
            <p tw="text-2xl text-balance">
              {transactionType} Transaction is being broadcasted
            </p>
            <div tw="flex flex-row w-fit items-center text-center align-middle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-loader"
              >
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
            </div>
          </div>
        </div>
      ),
      buttons: [
        <Button
          key="1"
          action="link"
          target={`https://basescan.org/tx/${transactionId}`}
        >
          See tx on Basescan
        </Button>,
        <Button action="post" key="2" target="/">
          Home
        </Button>,
      ],
    };
  }

  if (transactionReceipt.status === "success") {
    return {
      image: (
        <div tw="flex flex-col">
          <div tw="flex flex-col text-center items-center align-middle">
            <p tw="text-6xl text-balance">XMTP Base Frame</p>
            <p tw="text-4xl text-balance">{transactionType} Succeeded</p>
            <div tw="flex flex-row w-fit items-center text-center align-middle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-check"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>
      ),
      buttons: [
        <Button
          key="1"
          action="link"
          target={`https://basescan.org/tx/${transactionId}`}
        >
          See tx on Basescan
        </Button>,
        <Button action="post" key="2" target="/">
          Home
        </Button>,
      ],
    };
  } else if (transactionReceipt.status === "reverted") {
    return {
      image: (
        <div tw="flex flex-col">
          <div tw="flex flex-col text-center items-center align-middle">
            <p tw="text-6xl text-balance">XMTP Base Frame</p>
            <p tw="text-4xl text-balance">{transactionType} Failed</p>
            <div tw="flex flex-row w-fit items-center text-center align-middle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-x"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>
        </div>
      ),
      buttons: [
        <Button
          key="1"
          action="link"
          target={`https://basescan.org/tx/${transactionId}`}
        >
          See tx on Basescan
        </Button>,
        <Button action="post" key="2" target="/">
          Home
        </Button>,
      ],
    };
  }

  return {
    image: (
      <div tw="flex flex-col">
        <div tw="flex flex-col text-center items-center align-middle">
          <p tw="text-6xl text-balance">XMTP Base Frame</p>
          <p tw="text-4xl text-balance">{transactionType}</p>
          <div tw="flex flex-row w-fit items-center text-center align-middle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-rotate-ccw"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </div>
        </div>
      </div>
    ),
    buttons: [
      <Button
        key="1"
        action="link"
        target={`https://basescan.org/tx/${transactionId}`}
      >
        See tx on Basescan
      </Button>,
      <Button action="post" key="2" target="/">
        Home
      </Button>,
    ],
  };
});

export const POST = handler;
//export const GET = handler;
