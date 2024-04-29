import { Button } from "frames.js/next";
import { FrameDefinition, JsonValue } from "frames.js/types";
import { frames } from "@/app/frames/frames";
import { TOKENS, isApprovedToken } from "@/lib/tokens";
import { getTokenBalance } from "@/lib/utils";
import { isAddress, formatEther } from "viem";
import { CHAIN_ID, allowanceForSwap } from "@/lib/transactions";

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

  const userAddress =
    ctx.message?.requesterCustodyAddress || ctx.message?.verifiedWalletAddress;

  // user not connected
  if (!userAddress) {
    return {
      image: (
        <div tw="flex flex-col">
          <div tw="flex flex-col text-center items-center align-middle">
            <p tw="text-6xl text-balance">XMTP Base Frame</p>
            <p tw="text-3xl text-balance">
              You need to connect your wallet to swap tokens
            </p>
          </div>
        </div>
      ),
      buttons: [
        <Button action="post" key="1" target="/frames">
          Home
        </Button>,
      ],
    };
  }

  const transactionType = ctx.url.searchParams.get("transaction_type");
  const isValidTransactionType =
    !!transactionType && ["send", "swap", "mint"].includes(transactionType);

  // transaction_type not valid
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
          target={{ query: { transaction_type: "send" } }}
        >
          Send
        </Button>,
        <Button
          action="post"
          key="2"
          target={{ query: { transaction_type: "swap" } }}
        >
          Swap
        </Button>,
        <Button
          action="post"
          key="3"
          target={{ query: { transaction_type: "mint" } }}
        >
          Mint
        </Button>,
      ],
    };
  }

  // swap transaction
  if (transactionType == "swap") {
    const tokenFrom = ctx.url.searchParams.get("token_from");
    const isValidTokenFrom =
      !!tokenFrom && isApprovedToken(CHAIN_ID, tokenFrom || "");

    const tokenTo = ctx.url.searchParams.get("token_to");
    const isValidTokenTo =
      !!tokenTo && isApprovedToken(CHAIN_ID, tokenTo || "");

    const amount = ctx.message?.inputText || ctx.url.searchParams.get("amount");
    const isValidAmount =
      !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0.0;
    console.log("isValidAmount", isValidAmount, "amount", amount);

    if (!tokenFrom || !isValidTokenFrom) {
      const buttons = Object.keys(TOKENS[CHAIN_ID])
        .slice(0, 4)
        .map((token, index) => (
          <Button
            action="post"
            key={`${index + 1}`}
            target={`/transaction?transaction_type=swap&token_from=${token}`}
          >
            {token}
          </Button>
        )) as FrameDefinition<JsonValue>["buttons"];

      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">XMTP Base Frame</p>
              <p tw="text-3xl text-balance">
                Select the token that you want to swap
              </p>
            </div>
          </div>
        ),
        buttons: buttons,
      };
    }

    // tokenFrom is valid
    if (!tokenTo || !isValidTokenTo) {
      const buttonsFiltered = Object.keys(TOKENS[CHAIN_ID])
        .filter((token) => token !== tokenFrom)
        .slice(0, 4)
        .map((token, index) => (
          <Button
            action="post"
            key={`${index + 1}`}
            target={`/transaction?transaction_type=swap&token_from=${tokenFrom}&token_to=${token}`}
          >
            {token}
          </Button>
        )) as FrameDefinition<JsonValue>["buttons"];

      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">XMTP Base Frame</p>
              <p tw="text-3xl text-balance">
                You are swapping {tokenFrom} for ...
              </p>
              <p tw="text-3xl text-balance">
                Select the token that you want to receive from the swap
              </p>
            </div>
          </div>
        ),
        buttons: buttonsFiltered,
      };
    }

    // tokenFrom and tokenTo are valid
    if (!amount || !isValidAmount) {
      // user connected, check balance
      const userBalance = await getTokenBalance(userAddress, tokenFrom);
      const formattedBalance = formatEther(
        userBalance as unknown as bigint,
        "wei"
      );

      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">XMTP Base Frame</p>
              <p tw="text-3xl text-balance">
                Select the amount of {tokenFrom} that you want to swap
              </p>
              <p tw="text-3xl text-balance">
                You have {formattedBalance} {tokenFrom}
              </p>
            </div>
          </div>
        ),
        textInput: "amount 0.1",
        buttons: [
          <Button
            action="post"
            key="1"
            target={`/transaction?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
          >
            Next
          </Button>,
        ],
      };
    }

    // tokenFrom and tokenTo and amount are all valid
    if (isValidTokenFrom && isValidTokenTo && isValidAmount) {
      const { allowance } = await allowanceForSwap(
        tokenFrom,
        amount,
        userAddress
      );

      if (!allowance) {
        return {
          image: (
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">Approve Swap</p>
              <p tw="text-3xl text-balance">
                You are swapping {amount} {tokenFrom} for {tokenTo}
              </p>
            </div>
          ),
          buttons: [
            <Button
              action="tx"
              key="1"
              target={`/swap-approval?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
              post_url={`/transaction?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
            >
              Approve swap
            </Button>,
          ],
        };
      } else {
        return {
          image: (
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">Confirm Swap</p>
              <p tw="text-3xl text-balance">
                You are swapping {amount} {tokenFrom} for {tokenTo}
              </p>
            </div>
          ),
          buttons: [
            <Button
              action="tx"
              key="1"
              target={`/swap-complete?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
              post_url="/transaction-result"
            >
              Complete swap
            </Button>,
          ],
        };
      }
    }

    return {
      image: (
        <div tw="flex flex-col">
          <div tw="flex text-center items-center align-middle">
            <p tw="text-6xl text-balance">Swap</p>
            <p tw="text-3xl text-balance">
              You are swapping {amount} {tokenFrom} for {tokenTo}
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

  // send transaction
  if (transactionType == "send") {
    const recipientAddress =
      ctx.url.searchParams.get("recipient") || ctx.message?.inputText;
    const isValidReceiverAddress =
      !!recipientAddress && isAddress(recipientAddress || "");

    const token = ctx.url.searchParams.get("token");
    const isValidToken = !!token && isApprovedToken(CHAIN_ID, token || "");

    const amount = ctx.url.searchParams.get("amount") || ctx.message?.inputText;
    const isValidAmount =
      !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0.0;

    if (!isValidReceiverAddress) {
      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">XMTP Base Frame</p>
              <p tw="text-3xl text-balance">Enter the recipient address</p>
            </div>
          </div>
        ),
        textInput: "recipient address 0x...",
        buttons: [
          <Button
            action="post"
            key="1"
            target={`/transaction?transaction_type=send`}
          >
            Next
          </Button>,
        ],
      };
    }

    // recipient address is valid
    if (!isValidToken) {
      const buttons = Object.keys(TOKENS[CHAIN_ID])
        .slice(0, 4)
        .map((token, index) => (
          <Button
            action="post"
            key={`${index + 1}`}
            target={`/transaction?transaction_type=send&recipient=${recipientAddress}&token=${token}`}
          >
            {token}
          </Button>
        )) as FrameDefinition<JsonValue>["buttons"];

      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">XMTP Base Frame</p>
              <p tw="text-3xl text-balance">Select the token to send</p>
            </div>
          </div>
        ),
        buttons: buttons,
      };
    }

    // recipientAddress and token are valid
    if (!isValidAmount) {
      // user connected, check balance
      const userBalance = await getTokenBalance(userAddress, token);
      const formattedBalance = formatEther(
        userBalance as unknown as bigint,
        "wei"
      );
      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">XMTP Base Frame</p>
              <p tw="text-3xl text-balance">Enter the amount to send</p>
              <p tw="text-3xl text-balance">
                You have {formattedBalance} {token}
              </p>
            </div>
          </div>
        ),
        textInput: "amount 0.1",
        buttons: [
          <Button
            action="post"
            key="1"
            target={`/transaction?transaction_type=send&recipient=${recipientAddress}&token=${token}`}
          >
            Next
          </Button>,
        ],
      };
    }

    // recipientAddress, token and amount are valid
    if (isValidReceiverAddress && isValidToken && isValidAmount) {
      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col gap-1 justify-around text-center items-center align-middle">
              <p tw="text-6xl text-balance">Send</p>
              <p tw="text-3xl text-balance">
                You are sending {amount} {token}
              </p>
              <p tw="text-3xl text-balance">to {recipientAddress}</p>
            </div>
          </div>
        ),
        buttons: [
          <Button
            action="tx"
            key="1"
            target={`/transaction?transaction_type=send&recipient=${recipientAddress}&token=${token}&amount=${amount}`}
          >
            Confirm send
          </Button>,
        ],
      };
    }
  }

  // mint transaction
  if (transactionType == "mint") {
    const collectionAddress =
      ctx.url.searchParams.get("collection") || ctx.message?.inputText;
    const isValidCollectionAddress =
      !!collectionAddress && isAddress(collectionAddress);

    const tokenId =
      ctx.url.searchParams.get("token_id") || ctx.message?.inputText;
    const isValidTokenId =
      !!tokenId && !isNaN(parseFloat(tokenId)) && parseFloat(tokenId) > 0.0;

    if (!isValidCollectionAddress) {
      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">XMTP Base Frame</p>
              <p tw="text-3xl text-balance">Enter the collection address</p>
            </div>
          </div>
        ),
        textInput: "collection address 0x...",
        buttons: [
          <Button
            action="post"
            key="1"
            target={`/transaction?transaction_type=mint`}
          >
            Next
          </Button>,
        ],
      };
    }

    // collection address is valid
    if (isValidCollectionAddress && !isValidTokenId) {
      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center align-middle">
              <p tw="text-6xl text-balance">XMTP Base Frame</p>
              <p tw="text-3xl text-balance">Enter the token id</p>
            </div>
          </div>
        ),
        textInput: "token id 1",
        buttons: [
          <Button
            action="post"
            key="1"
            target={`/transaction?transaction_type=mint&collection=${collectionAddress}`}
          >
            Next
          </Button>,
        ],
      };
    }

    // collection address and tokenId are valid
    if (isValidCollectionAddress && isValidTokenId) {
      return {
        image: (
          <div tw="flex flex-col text-center items-center align-middle">
            <p tw="text-6xl text-balance">Mint</p>
            <p tw="text-3xl text-balance">
              You are minting token {tokenId} from collection{" "}
              {collectionAddress}
            </p>
          </div>
        ),
        buttons: [
          <Button
            action="tx"
            key="1"
            target={`/transaction?transaction_type=mint&collection=${collectionAddress}&token_id=${tokenId}`}
          >
            Confirm mint
          </Button>,
        ],
      };
    }
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
