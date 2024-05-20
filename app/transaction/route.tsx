import { Button } from "frames.js/next";
import { FrameDefinition, JsonValue } from "frames.js/types";
import { frames } from "@/app/transaction/frames";
import { TOKENS, isApprovedToken } from "@/lib/tokens";
import { appURL, checkTokenDecimals, getTokenBalance } from "@/lib/utils";
import { isAddress, formatUnits, parseUnits } from "viem";
import {
  CHAIN_ID,
  allowanceForSwap,
  isFixedPriceMintStrategy,
} from "@/lib/transactions";
import { getNftData } from "@/lib/nft-mint";

const handler = frames(async (ctx) => {
  const userAddress =
    ctx.message?.requesterVerifiedAddresses &&
    ctx.message?.requesterVerifiedAddresses.length > 0
      ? ctx.message?.requesterVerifiedAddresses[1]
      : ctx.message?.verifiedWalletAddress;

  const transactionType = ctx.url.searchParams
    .get("transaction_type")
    ?.toLowerCase();
  const isValidTransactionType =
    !!transactionType && ["send", "swap", "mint"].includes(transactionType);

  // transaction_type not valid
  if (!isValidTransactionType) {
    return {
      image: (
        <div tw="flex flex-col">
          <div tw="flex flex-col text-center items-center">
            <p tw="text-6xl text-balance">Base Frame</p>
            <p tw="text-3xl text-balance">What can you do with this frame?</p>
          </div>
        </div>
      ),
      buttons: [
        <Button action="post" key="1" target="/?transaction_type=swap">
          Swap
        </Button>,
        <Button action="post" key="2" target="/?transaction_type=send">
          Send
        </Button>,
        <Button action="post" key="3" target="/?transaction_type=mint">
          Mint
        </Button>,
        <Button action="post" key="4" target="/info">
          Learn More
        </Button>,
      ],
    };
  }

  // swap transaction
  if (transactionType == "swap") {
    const tokenFrom =
      ctx.url.searchParams.get("token_from")?.toUpperCase() || "";
    const isValidTokenFrom =
      !!tokenFrom && isApprovedToken(CHAIN_ID, tokenFrom);

    const tokenTo = ctx.url.searchParams.get("token_to")?.toUpperCase() || "";
    const isValidTokenTo = !!tokenTo && isApprovedToken(CHAIN_ID, tokenTo);

    const amount =
      ctx.url.searchParams.get("amount") || ctx.message?.inputText || "";
    const isValidAmount =
      !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0.0;

    if (!isValidTokenFrom) {
      const buttons = Object.keys(TOKENS[CHAIN_ID as number]).map(
        (token, index) => (
          <Button
            action="post"
            key={`${index + 1}`}
            target={`/?transaction_type=swap&token_from=${token}`}
          >
            {token}
          </Button>
        )
      ) as FrameDefinition<JsonValue>["buttons"];

      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center">
              <p tw="text-6xl text-balance">Base Frame</p>
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
    if (isValidTokenFrom && !isValidTokenTo) {
      const buttonsFiltered = Object.keys(TOKENS[CHAIN_ID as number])
        .filter((token) => token !== tokenFrom)
        .map((token, index) => (
          <Button
            action="post"
            key={`${index + 1}`}
            target={`/?transaction_type=swap&token_from=${tokenFrom}&token_to=${token}`}
          >
            {token}
          </Button>
        )) as FrameDefinition<JsonValue>["buttons"];

      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center">
              <p tw="text-6xl text-balance">Base Frame</p>
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
    if (isValidTokenFrom && isValidTokenTo && !isValidAmount) {
      if (!userAddress) {
        return {
          image: (
            <div tw="flex flex-col">
              <div tw="flex flex-col text-center items-center">
                <p tw="text-6xl text-balance">Base Frame</p>
                <p tw="text-3xl text-balance">
                  Select the amount of {tokenFrom} that you want to swap for{" "}
                  {tokenTo}
                </p>
              </div>
            </div>
          ),
          textInput: "amount 0.1",
          buttons: [
            <Button
              action="post"
              key="1"
              target={`/?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
            >
              Next
            </Button>,
          ],
        };
      } else {
        // user connected, check balance
        const userBalance = await getTokenBalance(userAddress, tokenFrom);
        const tokenInDecimals = await checkTokenDecimals(
          TOKENS[CHAIN_ID][tokenFrom]
        );
        const formattedBalance: string = formatUnits(
          userBalance,
          tokenInDecimals
        );

        return {
          image: (
            <div tw="flex flex-col">
              <div tw="flex flex-col text-center items-center">
                <p tw="text-6xl text-balance">Base Frame</p>
                <p tw="text-3xl text-balance">
                  Select the amount of {tokenFrom} that you want to swap for{" "}
                  {tokenTo}
                </p>
                <p tw="text-3xl text-balance">
                  You have {formattedBalance} {tokenFrom}
                </p>
                <p tw="text-3xl text-balance">You are {userAddress}</p>
              </div>
            </div>
          ),
          textInput: "amount 0.1",
          buttons: [
            <Button
              action="post"
              key="1"
              target={`/?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
            >
              Next
            </Button>,
          ],
        };
      }
    }

    // tokenFrom and tokenTo and amount are all valid
    if (isValidTokenFrom && isValidTokenTo && isValidAmount && userAddress) {
      const userBalance = await getTokenBalance(userAddress, tokenFrom);
      const tokenInDecimals = await checkTokenDecimals(
        TOKENS[CHAIN_ID][tokenFrom]
      );
      const bigIntAmount: bigint = parseUnits(amount, tokenInDecimals);
      const formattedBalance: string = formatUnits(
        userBalance,
        tokenInDecimals
      );

      if (userBalance < bigIntAmount) {
        return {
          image: (
            <div tw="flex flex-col text-center items-center">
              <p tw="text-6xl text-balance">Swap</p>
              <p tw="text-3xl text-balance">You are {userAddress}</p>
              <p tw="text-3xl text-balance">
                You have {formattedBalance} {tokenFrom} but you need at least{" "}
                {amount} {tokenFrom}
              </p>
              <p tw="text-3xl text-balance">
                Replenish your Base account and refresh
              </p>
            </div>
          ),
          buttons: [
            <Button
              key="1"
              action="link"
              target={`https://basescan.org/address/${userAddress}`}
            >
              See account on Basescan
            </Button>,
            <Button
              key="2"
              action="post"
              target={`/?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
            >
              Refresh balance
            </Button>,
          ],
        };
      }

      const { allowance } = await allowanceForSwap(
        tokenFrom,
        amount,
        userAddress
      );

      if (!allowance) {
        return {
          image: (
            <div tw="flex flex-col text-center items-center">
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
              target={`/api/swap/approval?token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
              post_url={`/?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
            >
              Approve swap
            </Button>,
            <Button
              key="2"
              action="post"
              target={`/?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
            >
              Refresh approval
            </Button>,
          ],
        };
      } else {
        return {
          image: (
            <div tw="flex flex-col text-center items-center">
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
              target={`/api/swap/complete?token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}&user_address=${userAddress}`}
              post_url={`/transaction-result?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}&user_address=${userAddress}`}
            >
              Complete swap
            </Button>,
          ],
        };
      }
    }

    return {
      image: (
        <div tw="relative flex flex-col text-center items-center justify-center">
          <img
            src={`${appURL()}/confirm-swap.png`}
            alt="Background"
            tw="w-full"
          />
          <div tw="w-full flex absolute text-white justify-between bottom-[117px] px-23 text-[24px] font-bold leading-8">
            <div tw="flex overflow-x-hidden w-[198px]">
              <div tw="mx-auto">{tokenFrom}</div>
            </div>
            <div tw="flex overflow-x-hidden w-[198px]">
              <div tw="mx-auto">{amount}</div>
            </div>
            <div tw="flex overflow-x-hidden w-[198px]">
              <div tw="mx-auto">{tokenTo}</div>
            </div>
          </div>
        </div>
      ),
      imageOptions: {
        aspectRatio: "1.91:1",
      },
      buttons: [
        <Button
          action="post"
          key="1"
          target={`/?transaction_type=swap&token_from=${tokenFrom}&token_to=${tokenTo}&amount=${amount}`}
        >
          Complete swap
        </Button>,
      ],
    };
  }

  // send transaction
  if (transactionType == "send") {
    const receiverAddress =
      ctx.url.searchParams.get("receiver") || ctx.message?.inputText || "";
    const isValidReceiverAddress =
      !!receiverAddress && isAddress(receiverAddress);

    const token = ctx.url.searchParams.get("token")?.toUpperCase() || "";
    const isValidToken = !!token && isApprovedToken(CHAIN_ID, token);

    const amount =
      ctx.url.searchParams.get("amount") || ctx.message?.inputText || "";
    const isValidAmount =
      !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0.0;

    if (!isValidReceiverAddress) {
      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center">
              <p tw="text-6xl text-balance">Base Frame</p>
              <p tw="text-3xl text-balance">Enter the receiver address</p>
            </div>
          </div>
        ),
        textInput: "receiver address 0x...",
        buttons: [
          <Button action="post" key="1" target={`/?transaction_type=send`}>
            Next
          </Button>,
          <Button action="post" key="2" target="/">
            Home
          </Button>,
        ],
      };
    }

    // receiver address is valid
    if (isValidReceiverAddress && !isValidToken) {
      const buttons = Object.keys(TOKENS[CHAIN_ID as number]).map(
        (token, index) => (
          <Button
            action="post"
            key={`${index + 1}`}
            target={`/?transaction_type=send&receiver=${receiverAddress}&token=${token}`}
          >
            {token}
          </Button>
        )
      ) as FrameDefinition<JsonValue>["buttons"];

      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center">
              <p tw="text-6xl text-balance">Base Frame</p>
              <p tw="text-3xl text-balance">Select the token to send</p>
            </div>
          </div>
        ),
        buttons: buttons,
      };
    }

    // receiverAddress and token are valid
    if (isValidReceiverAddress && isValidToken && !isValidAmount) {
      if (!userAddress) {
        return {
          image: (
            <div tw="flex flex-col">
              <div tw="flex flex-col text-center items-center">
                <p tw="text-6xl text-balance">Base Frame</p>
                <p tw="text-3xl text-balance">
                  Enter the amount of {token} you want to send to{" "}
                  {receiverAddress}
                </p>
              </div>
            </div>
          ),
          textInput: "amount 0.1",
          buttons: [
            <Button
              action="post"
              key="1"
              target={`/?transaction_type=send&receiver=${receiverAddress}&token=${token}`}
            >
              Next
            </Button>,
          ],
        };
      } else {
        // user connected, check balance
        const userBalance = await getTokenBalance(userAddress, token);
        const tokenInDecimals = await checkTokenDecimals(
          TOKENS[CHAIN_ID][token]
        );
        const formattedBalance: string = formatUnits(
          userBalance,
          tokenInDecimals
        );
        return {
          image: (
            <div tw="flex flex-col">
              <div tw="flex flex-col text-center items-center">
                <p tw="text-6xl text-balance">Base Frame</p>
                <p tw="text-3xl text-balance">
                  Enter the amount of {token} you want to send to{" "}
                  {receiverAddress}
                </p>
                <p tw="text-3xl text-balance">You are {userAddress}</p>
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
              target={`/?transaction_type=send&receiver=${receiverAddress}&token=${token}`}
            >
              Next
            </Button>,
          ],
        };
      }
    }

    // receiverAddress, token and amount are valid
    if (
      isValidReceiverAddress &&
      isValidToken &&
      isValidAmount &&
      userAddress
    ) {
      const userBalance = await getTokenBalance(userAddress, token);
      const tokenInDecimals = await checkTokenDecimals(TOKENS[CHAIN_ID][token]);
      const bigIntAmount: bigint = parseUnits(amount, tokenInDecimals);
      const formattedBalance: string = formatUnits(
        userBalance,
        tokenInDecimals
      );

      if (userBalance < bigIntAmount) {
        return {
          image: (
            <div tw="flex flex-col text-center items-center justify-around">
              <p tw="text-6xl text-balance">Transfer Token</p>
              <p tw="text-3xl mx-auto text-balance">You are {userAddress}</p>
              <p tw="text-3xl text-balance">
                You have {formattedBalance} {token} but you need at least{" "}
                {amount} {token}
              </p>
              <p tw="text-3xl mx-auto text-balance">
                Replenish your Base account and refresh
              </p>
            </div>
          ),
          buttons: [
            <Button
              key="1"
              action="link"
              target={`https://basescan.org/address/${userAddress}`}
            >
              See account on Basescan
            </Button>,
            <Button
              key="2"
              action="post"
              target={`/?transaction_type=send&receiver=${receiverAddress}&token=${token}&amount=${amount}`}
            >
              Refresh balance
            </Button>,
          ],
        };
      }
    }
    return {
      image: (
        <div tw="flex flex-col gap-1 justify-around text-center items-center">
          <p tw="text-6xl text-balance">Confirm Send</p>
          <p tw="text-3xl w-[70vw] mx-auto text-balance">
            You are sending {amount} {token} to {receiverAddress}
          </p>
        </div>
      ),
      buttons: [
        <Button
          action="tx"
          key="1"
          target={`/api/send/?receiver=${receiverAddress}&token=${token}&amount=${amount}`}
          post_url={`/transaction-result?transaction_type=send&receiver=${receiverAddress}&token=${token}&amount=${amount}`}
        >
          Complete send
        </Button>,
      ],
    };
  }

  // mint transaction
  if (transactionType == "mint") {
    const collectionAddress =
      ctx.url.searchParams.get("collection") || ctx.message?.inputText || "";
    const isValidCollectionAddress =
      !!collectionAddress && isAddress(collectionAddress);

    const tokenId =
      ctx.url.searchParams.get("token_id") || ctx.message?.inputText || "";
    const isValidTokenId =
      !!tokenId && !isNaN(parseFloat(tokenId)) && parseFloat(tokenId) > 0.0;

    if (!isValidCollectionAddress) {
      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center">
              <p tw="text-6xl text-balance">Base Frame</p>
              <p tw="text-3xl text-balance">Enter the collection address</p>
            </div>
          </div>
        ),
        textInput: "collection address 0x...",
        buttons: [
          <Button action="post" key="1" target={`/?transaction_type=mint`}>
            Next
          </Button>,
          <Button action="post" key="2" target="/">
            Home
          </Button>,
        ],
      };
    }

    // collection address is valid
    if (isValidCollectionAddress && !isValidTokenId) {
      return {
        image: (
          <div tw="flex flex-col">
            <div tw="flex flex-col text-center items-center">
              <p tw="text-6xl text-balance">Base Frame</p>
              <p tw="text-3xl text-balance">Enter the token id</p>
            </div>
          </div>
        ),
        textInput: "token id 1",
        buttons: [
          <Button
            action="post"
            key="1"
            target={`/?transaction_type=mint&collection=${collectionAddress}`}
          >
            Next
          </Button>,
        ],
      };
    }

    // collection address and tokenId are valid
    if (isValidCollectionAddress && isValidTokenId && userAddress) {
      const nftMetadata = await getNftData(collectionAddress, tokenId);

      const nftType = await isFixedPriceMintStrategy(
        collectionAddress,
        tokenId
      );

      const isFixedPriceNftStrategy = nftType?.isFixedPriceStrategy;

      const ethBalance = await getTokenBalance(userAddress, "ETH");
      const tokenInDecimals = await checkTokenDecimals(TOKENS[CHAIN_ID]["ETH"]);
      const formattedBalance: string = formatUnits(ethBalance, tokenInDecimals);

      if (!isFixedPriceNftStrategy) {
        return {
          image: (
            <div tw="flex flex-col text-center items-center">
              <p tw="text-6xl text-balance">Mint</p>
              <p tw="text-3xl text-balance">
                This Zora collection has a not supported minting strategy.
              </p>
            </div>
          ),
          buttons: [
            <Button action="post" key="1" target="/?transaction_type=mint">
              Retry with another collection
            </Button>,
          ],
        };
      } else {
        if (!!nftType && ethBalance < nftType.nftPrice) {
          const formattedNftPrice: string = formatUnits(nftType.nftPrice, 18);
          return {
            image: (
              <div tw="flex flex-col text-center items-center">
                <p tw="text-6xl text-balance">Mint</p>
                <p tw="text-3xl text-balance">You are {userAddress}</p>
                <p tw="text-3xl text-balance">
                  You have {formattedBalance} ETH but you need at least{" "}
                  {formattedNftPrice} ETH
                </p>
                <p tw="text-3xl text-balance">
                  Replenish your Base account and refresh
                </p>
                {/* {nftMetadata.image ? (
                <img
                  src={nftMetadata.image}
                  alt={nftMetadata.description}
                  width={"250px"}
                />
              ) : null} */}
              </div>
            ),
            buttons: [
              <Button
                key="1"
                action="link"
                target={`https://basescan.org/address/${userAddress}`}
              >
                See account on Basescan
              </Button>,
              <Button
                key="2"
                action="post"
                target={`/?transaction_type=mint&collection=${collectionAddress}&token_id=${tokenId}`}
              >
                Refresh balance
              </Button>,
            ],
          };
        }

        return {
          image: (
            <div tw="flex flex-col text-center items-center">
              <p tw="text-6xl text-balance">Mint</p>
              <p tw="text-3xl text-balance">
                You are minting {nftMetadata.name ? nftMetadata.name : null}{" "}
                token {tokenId} from collection {collectionAddress}
              </p>
              {/* {nftMetadata.image ? (
                <img
                  src={nftMetadata.image}
                  alt={nftMetadata.description}
                  width={"250px"}
                />
              ) : null} */}
            </div>
          ),
          buttons: [
            <Button
              action="tx"
              key="1"
              target={`/api/mint?collection=${collectionAddress}&token_id=${tokenId}&user_address=${userAddress}`}
              post_url={`/transaction-result?transaction_type=mint&collection=${collectionAddress}&token_id=${tokenId}`}
            >
              Confirm mint
            </Button>,
          ],
        };
      }
    }
    return {
      image: (
        <div tw="flex flex-col text-center items-center">
          <p tw="text-6xl text-balance">Mint</p>
          <p tw="text-3xl text-balance">
            You are minting token {tokenId} from collection {collectionAddress}
          </p>
          {/* {nftMetadata.image ? (
            <img
              src={nftMetadata.image}
              alt={nftMetadata.description}
              width={"250px"}
            />
          ) : null} */}
        </div>
      ),
      buttons: [
        <Button
          action="post"
          key="1"
          target={`/?transaction_type=mint&collection=${collectionAddress}&token_id=${tokenId}`}
        >
          Confirm mint
        </Button>,
      ],
    };
  }

  return {
    image: (
      <div tw="flex flex-col">
        <div tw="flex flex-col text-center items-center">
          <p tw="text-6xl text-balance">Base Frame</p>
          <p tw="text-3xl text-balance">What can you do with this frame?</p>
        </div>
      </div>
    ),
    buttons: [
      <Button action="post" key="1" target="/?transaction_type=swap">
        Swap
      </Button>,
      <Button action="post" key="2" target="/?transaction_type=send">
        Send
      </Button>,
      <Button action="post" key="3" target="/?transaction_type=mint">
        Mint
      </Button>,
      <Button action="post" key="4" target="/info">
        Learn More
      </Button>,
    ],
  };
});

export const GET = handler;
export const POST = handler;
