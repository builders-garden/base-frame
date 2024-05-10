import { Button } from "frames.js/next";
import { frames } from "@/app/transaction/frames";

const handler = frames(async (ctx) => {
  if (!ctx?.message?.isValid) {
    console.log("Invalid Frame");
  }

  return {
    image: (
      <div tw="flex flex-col w-full text-center items-center align-middle">
        <p tw="flex flex-col text-4xl text-center items-center align-middle">
          In this frame you can swap, send or mint
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

export const POST = handler;
