import { Suspense } from "react";
import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Studio } from "@/components/studio/Studio";
import { mirrorEnabled } from "@/lib/mirror";

export const metadata: Metadata = { title: "Studio" };

async function StudioFromParams({ searchParams }: { searchParams: PageProps<"/studio">["searchParams"] }) {
  const { item } = await searchParams;
  return <Studio initialItem={typeof item === "string" ? item : undefined} mirror={mirrorEnabled()} />;
}

export default function StudioPage({ searchParams }: PageProps<"/studio">) {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Suspense fallback={<div className="mx-auto mt-8 aspect-[3/4] w-full max-w-md animate-pulse rounded-[20px] bg-surface-2" />}>
          <StudioFromParams searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
