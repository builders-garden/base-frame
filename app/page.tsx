import Link from "next/link";
import {
  vercelURL,
  createDebugUrl,
  FRAMES_BASE_PATH,
  currentURL,
} from "@/lib/utils";
import type { Metadata } from "next";
import { fetchMetadata } from "frames.js/next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "XMTP Base Frame",
    description: "This is a frame to swap, send and mint on zora",
    other: {
      ...(await fetchMetadata(new URL(FRAMES_BASE_PATH, vercelURL()))),
    },
  };
}

export default async function Home() {
  const url = currentURL("/");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl">XMTP Base Frame</h1>
      <Link href={createDebugUrl(url)} className="underline">
        Debug
      </Link>
    </div>
  );
}
