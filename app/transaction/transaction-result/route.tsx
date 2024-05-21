import { Button } from "frames.js/next";
import { frames } from "@/app/transaction/frames";
import { publicClient } from "@/lib/transactions";
import { appURL } from "@/lib/utils";

const handler = frames(async (ctx) => {
  if (!ctx?.message?.isValid) {
    console.log("Invalid Frame");
  }

  const transactionType = ctx.url.searchParams.get("transaction_type");
  console.log("transactionType", transactionType);
  const isValidTransactionType =
    !!transactionType && ["send", "swap", "mint"].includes(transactionType);

  const transactionId =
    ctx.message?.transactionId || ctx.url.searchParams.get("tx");

  // transaction_type not valid
  if (!isValidTransactionType || !transactionId) {
    return {
      image: (
        <div tw="relative flex flex-col text-center items-center justify-center">
          <img src={`${appURL()}/images/frames/landing.png`} tw="w-full" />
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
        <div tw="relative flex flex-col text-center items-center justify-center">
          <img
            src={`${appURL()}/images/frames/result/loading.png`}
            tw="w-full"
          />
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
        <Button
          key="2"
          action="post"
          target={`/transaction-result?transaction_type=${transactionType}&tx=${transactionId}`}
        >
          Refresh
        </Button>,
        <Button action="post" key="3" target="/">
          Home
        </Button>,
      ],
    };
  }

  if (transactionReceipt.status === "success") {
    return {
      image: (
        <div tw="relative flex flex-col text-center items-center justify-center">
          <img
            src={`${appURL()}/images/frames/result/success.png`}
            tw="w-full"
          />
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
        <div tw="relative flex flex-col text-center items-center justify-center">
          <img
            src={`${appURL()}/images/frames/result/failed.png`}
            tw="w-full"
          />
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
      <div tw="relative flex flex-col text-center items-center justify-center">
        <img src={`${appURL()}/images/frames/result/loading.png`} tw="w-full" />
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
      <Button
        key="2"
        action="post"
        target={`/transaction-result?transaction_type=${transactionType}&tx=${transactionId}`}
      >
        Refresh
      </Button>,
      <Button action="post" key="3" target="/">
        Home
      </Button>,
    ],
  };
});

export const GET = handler;
export const POST = handler;
