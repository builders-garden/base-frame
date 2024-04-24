import Link from "next/link";
import { vercelURL, createDebugUrl, currentURL } from "@/lib/utils";
import type { Metadata } from "next";
import { fetchMetadata } from "frames.js/next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "New api example",
    description: "This is a new api example",
    other: {
      ...(await fetchMetadata(
        new URL("/frames", vercelURL() || "http://localhost:3000")
      )),
    },
  };
}

export default async function Home() {
  const url = currentURL("/");

  return (
    <div className="flex flex-col gap-2">
      Stringz landing page
      <Link href={createDebugUrl(url)} className="underline">
        Debug
      </Link>
    </div>
  );
}
