import { Suspense } from "react";
import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Mirror } from "@/components/mirror/Mirror";
import { mirrorEnabled } from "@/lib/mirror";

export const metadata: Metadata = { title: "Live mirror" };

async function MirrorFromParams({ searchParams }: { searchParams: PageProps<"/mirror">["searchParams"] }) {
  const { item } = await searchParams;
  return <Mirror enabled={mirrorEnabled()} initialItem={typeof item === "string" ? item : undefined} />;
}

export default function MirrorPage({ searchParams }: PageProps<"/mirror">) {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <h1 className="sr-only">Billy live mirror</h1>
        <Suspense fallback={<div className="mx-auto mt-8 aspect-[3/4] w-full max-w-4xl animate-pulse rounded-[20px] bg-surface-2 sm:aspect-video" />}>
          <MirrorFromParams searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
