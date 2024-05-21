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
      ? ctx.message?.requesterVerifiedAddresses[0]
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
        <div tw="relative flex flex-col text-center items-center justify-center">
          <img src={`${appURL()}/images/frames/landing.png`} tw="w-full" />
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
          <div tw="relative flex flex-col justify-center">
            <img
              src={`${appURL()}/images/frames/swap/token-from.png`}
              tw="w-full"
            />
          </div>
        ),
        buttons: buttons,
      };
    }

    // tokenFrom is valid
    if (isValidTokenFrom && !isValidAmount) {
      if (!userAddress) {
        return {
          image: (
            <div tw="relative flex flex-col justify-center">
              <img
                src={`${appURL()}/images/frames/swap/token-from-amount.png`}
                tw="w-full"
              />
              <div tw="flex absolute text-white overflow-x-hidden w-[200px] bottom-[118px] left-0 pl-[160px] text-[24px] leading-8">
                <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                  {tokenFrom}
                </div>
              </div>
            </div>
          ),
          textInput: "amount 0.1",
          buttons: [
            <Button
              action="post"
              key="1"
              target={`/?transaction_type=swap&token_from=${tokenFrom}&amount=${amount}&token_to=${tokenTo}`}
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
            <div tw="relative flex flex-col justify-center">
              <img
                src={`${appURL()}/images/frames/swap/token-from-amount-balance.png`}
                tw="w-full"
              />
              <div tw="flex absolute text-white overflow-x-hidden w-[200px] bottom-[118px] left-0 pl-[160px] text-[24px] leading-8">
                <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                  {tokenFrom}
                </div>
              </div>
              <div tw="flex absolute text-white bottom-[35px] left-0 pl-[380px] text-[24px]">
                <div tw="flex w-[200px]">
                  <p tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {formattedBalance.slice(0, 8)} {tokenFrom}
                  </p>
                </div>
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

    // tokenFrom and tokenTo are valid
    if (isValidTokenFrom && isValidAmount && !isValidTokenTo) {
      const buttonsFiltered = Object.keys(TOKENS[CHAIN_ID as number])
        .filter((token) => token !== tokenFrom)
        .map((token, index) => (
          <Button
            action="post"
            key={`${index + 1}`}
            target={`/?transaction_type=swap&token_from=${tokenFrom}&amount=${amount}&token_to=${token}`}
          >
            {token}
          </Button>
        )) as FrameDefinition<JsonValue>["buttons"];
      return {
        image: (
          <div tw="relative flex flex-col justify-center">
            <img
              src={`${appURL()}/images/frames/swap/token-to.png`}
              tw="w-full"
            />
            <div tw="w-full flex absolute text-white justify-between bottom-[120px] px-23 text-[24px] font-bold leading-8">
              <div tw="flex overflow-x-hidden w-[198px]">
                <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                  {tokenFrom}
                </div>
              </div>
              <div tw="flex overflow-x-hidden w-[198px]">
                <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                  {amount}
                </div>
              </div>
              <div tw="flex overflow-x-hidden w-[198px]">
                <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                  {" "}
                </div>
              </div>
            </div>
          </div>
        ),
        buttons: buttonsFiltered,
      };
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
            <div tw="relative flex flex-col text-center items-center justify-center">
              <img
                src={`${appURL()}/images/frames/swap/failed.png`}
                tw="w-full"
              />
              <div tw="w-full flex absolute text-white top-[140px] pl-16 text-[24px] font-light leading-8">
                <div tw="flex">
                  <p>
                    You are trying to swap
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      {amount} {tokenFrom}
                    </b>
                    but you only have
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      {formattedBalance.slice(0, 8)} {tokenFrom}
                    </b>
                  </p>
                </div>
              </div>
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
            <div tw="relative flex flex-col text-center items-center justify-center">
              <img
                src={`${appURL()}/images/frames/swap/approve.png`}
                tw="w-full"
              />
              <div tw="w-full flex absolute text-white top-[140px] pl-16 text-[32px] font-light leading-8">
                <div tw="flex">
                  <p>
                    Approve the swap of
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      {amount} {tokenFrom}
                    </b>
                    for
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      {tokenTo}
                    </b>
                  </p>
                </div>
              </div>
              <div tw="w-full flex absolute text-white justify-between bottom-[140px] px-23 text-[24px] font-bold leading-8">
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {tokenFrom}
                  </div>
                </div>
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {amount}
                  </div>
                </div>
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {tokenTo}
                  </div>
                </div>
              </div>
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
            <div tw="relative flex flex-col text-center items-center justify-center">
              <img
                src={`${appURL()}/images/frames/swap/confirm.png`}
                tw="w-full"
              />
              <div tw="w-full flex absolute text-white top-[140px] pl-16 text-[24px] font-light leading-8">
                <div tw="flex">
                  <p>
                    Confirm the swap of
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      {amount} {tokenFrom}
                    </b>
                    for
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      {tokenTo}
                    </b>
                  </p>
                </div>
              </div>
              <div tw="w-full flex absolute text-white justify-between bottom-[117px] px-23 text-[24px] font-bold leading-8">
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {tokenFrom}
                  </div>
                </div>
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {amount}
                  </div>
                </div>
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {tokenTo}
                  </div>
                </div>
              </div>
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
          <img src={`${appURL()}/images/frames/swap/confirm.png`} tw="w-full" />
          <div tw="w-full flex absolute text-white top-[140px] pl-16 text-[24px] font-light leading-8">
            <div tw="flex">
              <p>
                Confirm the swap of
                <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                  {amount} {tokenFrom}
                </b>
                for
                <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                  {tokenTo}
                </b>
              </p>
            </div>
          </div>
          <div tw="w-full flex absolute text-white justify-between bottom-[117px] px-23 text-[24px] font-bold leading-8">
            <div tw="flex overflow-x-hidden w-[198px]">
              <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                {tokenFrom}
              </div>
            </div>
            <div tw="flex overflow-x-hidden w-[198px]">
              <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                {amount}
              </div>
            </div>
            <div tw="flex overflow-x-hidden w-[198px]">
              <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                {tokenTo}
              </div>
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
          <div tw="relative flex flex-col justify-center">
            <img
              src={`${appURL()}/images/frames/send/recipient.png`}
              tw="w-full"
            />
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
          <div tw="relative flex flex-col justify-center">
            <img
              src={`${appURL()}/images/frames/send/send-token.png`}
              tw="w-full"
            />
            <div tw="flex absolute text-white bottom-[105px] left-0 pl-[90px]">
              <div tw="flex h-[60px] w-[200px] items-center text-center">
                <p
                  tw="text-[24px] px-3"
                  style={{ fontFamily: "Urbanist-Bold" }}
                >
                  {`${receiverAddress.slice(0, 7)}...${receiverAddress.slice(
                    -4
                  )}`}
                </p>
              </div>
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
            <div tw="relative flex flex-col justify-center">
              <img
                src={`${appURL()}/images/frames/send/amount.png`}
                tw="w-full"
              />
              <div tw="w-full flex absolute text-white justify-between bottom-[120px] px-23 text-[24px] font-bold leading-8">
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {`${receiverAddress.slice(0, 7)}...${receiverAddress.slice(
                      -4
                    )}`}
                  </div>
                </div>
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {token}
                  </div>
                </div>
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {" "}
                  </div>
                </div>
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
            <div tw="relative flex flex-col justify-center">
              <img
                src={`${appURL()}/images/frames/send/amount-balance.png`}
                tw="w-full"
              />
              <div tw="w-full flex absolute text-white justify-between bottom-[120px] px-23 text-[24px] font-bold leading-8">
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {`${receiverAddress.slice(0, 7)}...${receiverAddress.slice(
                      -4
                    )}`}
                  </div>
                </div>
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {token}
                  </div>
                </div>
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {" "}
                  </div>
                </div>
              </div>
              <div tw="w-full flex absolute text-white justify-end bottom-[60px] px-23 text-[24px] font-bold leading-8">
                <div tw="flex overflow-x-hidden w-[198px]">
                  <div
                    tw="flex mx-auto"
                    style={{ fontFamily: "Urbanist-Bold" }}
                  >
                    {formattedBalance.slice(0, 8)} {token}
                  </div>
                </div>
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
            <div tw="relative flex flex-col justify-center">
              <img
                src={`${appURL()}/images/frames/send/send-failed.png`}
                tw="w-full"
              />
              <div tw="w-full flex absolute text-white top-[140px] pl-16 text-[24px] font-light leading-8">
                <div tw="flex">
                  <p>
                    You are trying to send
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      {amount} {token}
                    </b>
                    but you only have
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      {formattedBalance.slice(0, 8)} {token}
                    </b>
                  </p>
                </div>
              </div>
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
        <div tw="relative flex flex-col justify-center">
          <img src={`${appURL()}/images/frames/send/confirm.png`} tw="w-full" />
          <div tw="w-full flex absolute text-white top-[140px] pl-16 text-[24px] font-light leading-8">
            <div tw="flex">
              <p>
                Confirm sending of
                <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                  {amount} {token}
                </b>
                to
                <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                  {`${receiverAddress.slice(0, 7)}...${receiverAddress.slice(
                    -4
                  )}`}
                </b>
              </p>
            </div>
          </div>
          <div tw="w-full flex absolute text-white justify-between bottom-[120px] px-23 text-[24px] font-bold leading-8">
            <div tw="flex overflow-x-hidden w-[198px]">
              <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                {`${receiverAddress.slice(0, 7)}...${receiverAddress.slice(
                  -4
                )}`}
              </div>
            </div>
            <div tw="flex overflow-x-hidden w-[198px]">
              <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                {token}
              </div>
            </div>
            <div tw="flex overflow-x-hidden w-[198px]">
              <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                {amount.slice(0, 8)}
              </div>
            </div>
          </div>
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
          <div tw="relative flex flex-col text-center items-center justify-center">
            <img
              src={`${appURL()}/images/frames/mint/collection.png`}
              tw="w-full"
            />
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
          <div tw="relative flex flex-col text-center items-center justify-center">
            <img
              src={`${appURL()}/images/frames/mint/token-id.png`}
              tw="w-full"
            />
            <div tw="w-full flex absolute text-white justify-start bottom-[117px] px-23 text-[24px] font-bold leading-8">
              <div tw="flex overflow-x-hidden w-[340px]">
                <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                  {`${collectionAddress.slice(
                    0,
                    12
                  )}...${collectionAddress.slice(-6)}`}
                </div>
              </div>
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
            <div tw="relative flex flex-col text-center items-center justify-center">
              <img
                src={`${appURL()}/images/frames/mint/failed-strategy.png`}
                tw="w-full"
              />
              <div tw="w-full flex absolute text-white top-[140px] pl-16 text-[24px] font-light leading-8">
                <div tw="flex">
                  <p>
                    You are trying to mint NFT #{tokenId}
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      {`${collectionAddress.slice(
                        0,
                        12
                      )}...${collectionAddress.slice(-6)}`}
                    </b>
                  </p>
                </div>
              </div>
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
              <div tw="relative flex flex-col text-center items-center justify-center">
                <img
                  src={`${appURL()}/images/frames/mint/failed-balance.png`}
                  tw="w-full"
                />
                <div tw="w-full flex absolute text-white top-[140px] pl-16 text-[24px] font-light leading-8">
                  <div tw="flex">
                    <p>
                      You are trying to mint NFT #{tokenId}
                      <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                        {`${collectionAddress.slice(
                          0,
                          12
                        )}...${collectionAddress.slice(-6)}`}
                      </b>
                    </p>
                  </div>
                  <div tw="flex">
                    <p tw="text-3xl text-balance">
                      You have {formattedBalance} ETH but you need at least{" "}
                      {formattedNftPrice} ETH
                    </p>
                  </div>
                </div>
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
            <div tw="relative flex flex-col text-center items-center justify-center">
              <img
                src={`${appURL()}/images/frames/mint/confirm.png`}
                tw="w-full"
              />
              <div tw="w-full flex absolute text-white top-[140px] pl-16 text-[24px] font-light leading-8">
                <div tw="flex">
                  <p>
                    Confirm minting of NFT
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      #{tokenId}
                    </b>
                    <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                      {`${collectionAddress.slice(
                        0,
                        12
                      )}...${collectionAddress.slice(-6)}`}
                    </b>
                  </p>
                </div>
              </div>
              <div tw="w-full flex absolute text-white justify-between bottom-[117px] px-23 text-[24px] font-bold leading-8">
                <div tw="flex overflow-x-hidden w-[340px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {`${collectionAddress.slice(
                      0,
                      12
                    )}...${collectionAddress.slice(-6)}`}
                  </div>
                </div>
                <div tw="flex overflow-x-hidden w-[340px]">
                  <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                    {tokenId}
                  </div>
                </div>
              </div>
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
        <div tw="relative flex flex-col text-center items-center justify-center">
          <img src={`${appURL()}/images/frames/mint/confirm.png`} tw="w-full" />
          <div tw="w-full flex absolute text-white top-[140px] pl-16 text-[24px] font-light leading-8">
            <div tw="flex">
              <p>
                Confirm minting of NFT
                <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                  #{tokenId}
                </b>
                <b tw="mx-2" style={{ fontFamily: "Urbanist-Bold" }}>
                  {`${collectionAddress.slice(
                    0,
                    12
                  )}...${collectionAddress.slice(-6)}`}
                </b>
              </p>
            </div>
          </div>
          <div tw="w-full flex absolute text-white justify-between bottom-[117px] px-23 text-[24px] font-bold leading-8">
            <div tw="flex overflow-x-hidden w-[340px]">
              <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                {`${collectionAddress.slice(0, 12)}...${collectionAddress.slice(
                  -6
                )}`}
              </div>
            </div>
            <div tw="flex w-[340px]">
              <div tw="mx-auto" style={{ fontFamily: "Urbanist-Bold" }}>
                {tokenId}
              </div>
            </div>
          </div>
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
      <div tw="relative flex flex-col text-center items-center justify-center">
        <img src={`${appURL()}/images/frames/landing.png`} tw="w-full" />
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
