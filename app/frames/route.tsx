import { Button } from "frames.js/next";
import { frames } from "@/app/frames/frames";

const handleRequest = frames(async (ctx) => {
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
