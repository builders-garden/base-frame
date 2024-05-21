import { ZDK, ZDKNetwork, ZDKChain } from "@zoralabs/zdk";

const zdk = new ZDK({
  endpoint: "https://api.zora.co/graphql",
  networks: [
    {
      network: ZDKNetwork.Base,
      chain: ZDKChain.BaseMainnet,
    },
  ],
  apiKey: process.env.ZORA_API_KEY,
});

export const getNftData = async (
  collectionAddress: string,
  tokenId: string
) => {
  const response = await zdk.token({
    token: {
      address: collectionAddress as `0x${string}`,
      tokenId: tokenId,
    },
    networks: [
      {
        network: ZDKNetwork.Base,
        chain: ZDKChain.BaseMainnet,
      },
    ],
  });
  let imgUrl = response.token?.token.image?.url;
  if (imgUrl?.includes("ipfs://")) {
    const hash = imgUrl.split("ipfs://").pop();
    imgUrl = `https://${hash}.ipfs.cf-ipfs.com`;
  }

  return {
    name: response?.token?.token.name || "",
    description: response?.token?.token.description || "",
    image: imgUrl || "",
  };
};
