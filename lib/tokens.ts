interface TokenMap {
  [key: number]: {
    [key: string]: `0x${string}` | string;
  };
}

// Custom token list for the different networks
export const TOKENS: TokenMap = {
  8453: {
    ETH: "0x0000000000000000000000000000000000000000",
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    DEGEN: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed",
  },
};

export const isApprovedToken = (chainId: number, token: string): boolean => {
  if (!chainId || !token) {
    return false;
  }
  return Object.keys(TOKENS[chainId]).includes(token);
};
