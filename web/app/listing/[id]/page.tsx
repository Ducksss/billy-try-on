import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Info, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { Footer, Nav } from "@/components/site/Nav";
import { catalogue, formatPrice, getListing } from "@/lib/catalogue";
import { mirrorEnabled } from "@/lib/mirror";

export function generateStaticParams() {
  return catalogue.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: PageProps<"/listing/[id]">): Promise<Metadata> {
  const listing = getListing((await params).id);
  return { title: listing?.title ?? "Listing" };
}

export default async function ListingPage({ params }: PageProps<"/listing/[id]">) {
  const listing = getListing((await params).id);
  if (!listing) notFound();

  const looks = ["mei", "arjun"].filter((p) => LOOKS.has(`${p}-${listing.id}`));
  const facts = [
    ["Condition", listing.condition],
    ["Size", listing.size],
    ["Source", listing.kind === "pre-loved" ? "Pre-loved, one owner" : "Retailer surplus"],
    ["Seller", listing.seller],
  ];

  return (
    <>
      <Nav />
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-10 px-4 pb-24 pt-10 md:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`relative aspect-[3/4] overflow-hidden rounded-[20px] bg-surface-2 ${looks.length ? "" : "sm:col-span-2"}`}>
            <Image src={listing.image} alt={listing.title} fill priority sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
          </div>
          {looks.slice(0, 1).map((p) => (
            <div key={p} className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-surface-2">
              <Image
                src={`/looks/${p}-${listing.id}.jpg`}
                alt={`${p === "mei" ? "Mei" : "Arjun"} trying on the ${listing.title}`}
                fill
                sizes="(min-width: 1024px) 30vw, 90vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div className="lg:pt-4">
          <p className="text-sm text-muted">{listing.kind === "pre-loved" ? "Pre-loved" : "Surplus stock"}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{listing.title}</h1>
          <p className="mt-3 text-2xl">
            {formatPrice(listing.price)}
            {listing.originalPrice && (
              <span className="ml-2 text-lg text-muted line-through">{formatPrice(listing.originalPrice)}</span>
            )}
          </p>
          <p className="mt-6 max-w-[52ch] leading-relaxed text-muted">{listing.note}</p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={`/studio?item=${listing.id}`} className="btn btn-primary">
              Try it on
              <ArrowRight size={16} weight="bold" />
            </Link>
            {mirrorEnabled() && (
              <Link href={`/mirror?item=${listing.id}`} className="btn btn-ghost">
                <VideoCamera size={16} weight="bold" />
                Try it live
              </Link>
            )}
          </div>

          <p className="mt-8 flex max-w-[52ch] gap-2.5 rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-muted">
            <Info size={18} weight="bold" className="mt-0.5 shrink-0" />
            Demo listing. In the live version this button hands you to the seller&apos;s own page on their resale app or
            store, and Billy is paid a referral fee only if you buy.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

const LOOKS = new Set([
  "mei-denim-trucker",
  "mei-gingham-dress",
  "mei-cable-cardigan",
  "mei-black-blazer",
  "arjun-windbreaker-90s",
  "arjun-olive-overshirt",
  "arjun-rust-cord-shirt",
  "arjun-linen-camp-shirt",
]);
