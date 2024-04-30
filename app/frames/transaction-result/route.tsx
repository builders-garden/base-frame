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
  console.log("Frame Transaction Result ctx:", ctx);

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
      <Button action="post" key="2" target="/transaction?transaction_type=swap">
        Swap
      </Button>,
      <Button action="post" key="1" target="/transaction?transaction_type=send">
        Send
      </Button>,
      <Button action="post" key="3" target="/transaction?transaction_type=mint">
        Mint
      </Button>,
      <Button action="post" key="4" target="/info">
        Learn More
      </Button>,
    ],
  };
});
