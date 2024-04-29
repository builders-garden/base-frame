interface TokenMap {
  [key: number]: {
    [key: string]: `0x${string}` | string;
  };
}

// Custom token list for the different networks
export const TOKENS: TokenMap = {
  8453: {
    ETH: "0x0000000000000000000000000000000000000000",
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    DEGEN: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed",
  },
};
