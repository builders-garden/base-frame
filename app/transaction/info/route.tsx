import { Button } from "frames.js/next";
import { frames } from "@/app/transaction/frames";
import { appURL } from "@/lib/utils";

const handler = frames(async (ctx) => {
  if (!ctx?.message?.isValid) {
    console.log("Invalid Frame");
  }

  return {
    image: (
      <div tw="relative flex flex-col text-center items-center justify-center">
        <img src={`${appURL()}/images/frames/landing.png`} tw="w-full" />
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
