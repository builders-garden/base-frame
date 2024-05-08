import Link from "next/link";
import { vercelURL, createDebugUrl, currentURL } from "@/lib/utils";
import type { Metadata } from "next";
import { fetchMetadata } from "frames.js/next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Base Frame",
    description: "This is a new transaction frame",
    other: {
      ...(await fetchMetadata(new URL("/frames", vercelURL()))),
    },
  };
}

export default async function Home() {
  const url = currentURL("/");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl">Base Frame</h1>
      <Link href={createDebugUrl(url)} className="underline">
        Debug
      </Link>
    </div>
  );
}
