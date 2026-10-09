import type { Metadata } from "next";
import { Footer, Nav } from "@/components/site/Nav";
import { DiscoverGrid } from "@/components/discover/DiscoverGrid";

export const metadata: Metadata = { title: "Pre-loved feed" };

export default function DiscoverPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-12 md:px-8">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Pre-loved feed</h1>
        <p className="mt-3 max-w-[60ch] text-muted">
          Second-hand pieces from local sellers and unsold stock from retailers. Try anything on before you message the
          seller.
        </p>
        <DiscoverGrid />
      </main>
      <Footer />
    </>
  );
}
