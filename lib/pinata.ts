import { FrameActionPayload, PinataFDK } from "pinata-fdk";
import { vercelURL } from "@/lib/utils";

export const pinataFdk = new PinataFDK({
  pinata_jwt: process.env.PINATA_JWT!,
  pinata_gateway: process.env.PINATA_GATEWAY!,
});

export const validateFrameMessage = async (message: FrameActionPayload) => {
  if (vercelURL().includes("localhost")) {
    return { isValid: true };
  }
  return await pinataFdk.validateFrameMessage(message);
};
