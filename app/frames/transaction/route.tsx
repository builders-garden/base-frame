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
