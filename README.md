# Base Frame

This is a frame following the [frames.js OpenFrames](https://framesjs.org/middleware/openframes) standard, working on Base mainnet.

## Usage

```jsx
function generateTransactionUrl(transactionType, params) {
  const baseUrl = "http://localhost:3001/";
  let queryParams = new URLSearchParams({
    transactionType,
    ...params,
  }).toString();
  return `${baseUrl}?${queryParams}`;
}

// Usage examples:
let sendUrl = generateTransactionUrl("send", {
  buttonName: "Send",
  amount: 250,
  token: "BTC",
  token_to: "recipient_address",
});
let swapUrl = generateTransactionUrl("swap", {
  buttonName: "Swap",
  amount: 100,
  token_from: "ETH",
  token_to: "DAI",
});
let mintUrl = generateTransactionUrl("mint", {
  buttonName: "Mint",
  collection: "0x123456789ABCDEF",
  token_id: 1023,
});
```

1. **Send Transaction:**
   - **Purpose**: To send a specified amount of a cryptocurrency to a destination address.
   - **Example URL**: `http://localhost:3001/?transactionType=send&buttonName=Send&amount=1&token=USDC`
   - **Parameters**:
     - `transactionType=send` indicates the action of sending currency.
     - `amount=250` specifies the amount of BTC to be sent.
     - `token=BTC` indicates that Bitcoin is the currency being sent.
     - `token_to=` specifies the recipient's address. It’s hardcoded in the code
2. **Swap Transaction:**
   - **Purpose**: To exchange one type of cryptocurrency for another.
   - **Example URL**: `http://localhost:3001/?transactionType=swap&buttonName=Swap&amount=1&token_from=ETH&token_to=DAI`
   - **Parameters**:
     - `transactionType=swap` indicates a swap action.
     - `amount=100` specifies the amount of ETH to be exchanged.
     - `token_from=ETH` indicates that Ethereum is the currency being swapped.
     - `token_to=DAI` specifies DAI as the currency to receive in the swap.
3. **Mint Transaction:**
   - **Purpose**: To create (mint) a new token or NFT.
   - **Example URL**: `http://localhost:3001/?transactionType=mint&buttonName=Mint&collection=0x123456789ABCDEF&token_id=1023`
   - **Parameters**:
     - `transactionType=mint` indicates the minting of a new NFT.
     - `collection=0x...` specifies the NFT collection.
     - `token_id=1023` specifies the unique identifier of the NFT within the collection.

## Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Click on Debug to open the frames.js debugger, sign in with farcaster or with wallet to try XMTP openframes.

You can start editing the frame by modifying `app/frames/route.tsx`.

The flow logic is in the `app/frames/transaction/route.tsx` file.

The files `app/frames/mint-complete/route.ts`, `app/frames/send-complete/route.ts`, `app/frames/swap-complete/route.ts` e `app/frames/swap-approval/route.ts` handles the logic for the completion of the mint, send, swap and swap approval transactions.

After a transaction is made, the user is redirected to the `app/frames/transaction-result/route.tsx` frame, which shows the status (if the transactionReceipt is available).

Under the hood, this project uses the following libraries:

- [Enso Finance](https://enso.finance) for the swap transaction
- [Zora ZDK](https://docs.zora.co/docs/zora-api/zdk) to retrieve the NFT metadata for the mint transaction
- [Viem](https://viem.sh) for everything else
