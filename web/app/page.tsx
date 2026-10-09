import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PuzzlePiece } from "@phosphor-icons/react/dist/ssr";
import { Footer, Nav } from "@/components/site/Nav";
import { HeroTryOn } from "@/components/landing/HeroTryOn";
import { Reveal } from "@/components/landing/Reveal";
import { catalogue, formatPrice, getListing } from "@/lib/catalogue";

const gallery = [
  ["arjun", "windbreaker-90s"],
  ["mei", "gingham-dress"],
  ["arjun", "rust-cord-shirt"],
  ["mei", "cable-cardigan"],
  ["arjun", "olive-overshirt"],
  ["mei", "black-blazer"],
  ["arjun", "linen-camp-shirt"],
  ["mei", "denim-trucker"],
] as const;

const steps = [
  {
    title: "Add one photo of yourself",
    body: "A full-length photo in fitted clothes works best. It stays in your browser until you run a try-on.",
    image: "/models/arjun.jpg",
    alt: "Arjun's full-length photo",
  },
  {
    title: "Drag a garment onto it",
    body: "From a resale listing, a brand's site or Billy's own feed. Hover any product photo and press Try on, or drag it into the side panel.",
    image: "/catalogue/windbreaker-90s.jpg",
    alt: "90s colour-block windbreaker product photo",
  },
  {
    title: "Save looks and compare",
    body: "Keep the ones you like, put two side by side, and decide before you message the seller or check out.",
    image: "/looks/arjun-windbreaker-90s.jpg",
    alt: "Arjun wearing the windbreaker",
  },
];

const bento = ["denim-trucker", "olive-overshirt", "sage-slip-dress", "charcoal-trousers", "breton-tee"];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 md:px-8 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-14 lg:pb-16 lg:pt-8 xl:grid-cols-[1fr_minmax(0,32rem)]">
          <div className="max-w-xl">
            <h1 className="text-[2.75rem] font-semibold leading-[1.02] tracking-tighter md:text-[3.5rem] xl:text-[4.25rem]">
              Try on <span className="whitespace-nowrap">pre-loved</span> before you buy.
            </h1>
            <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-muted">
              Drag a garment from any shop or resale listing onto your photo. Billy shows how it looks on you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/studio" className="btn btn-primary">
                Try it on
                <ArrowRight size={16} weight="bold" />
              </Link>
              <Link href="/extension" className="btn btn-ghost">
                <PuzzlePiece size={16} weight="bold" />
                Add to Chrome
              </Link>
            </div>
          </div>
          <HeroTryOn />
        </section>

        <section className="border-t border-line py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Reveal>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
                Two photos. Eight outfits from the feed.
              </h2>
              <p className="mt-3 max-w-[60ch] text-muted">
                Every look below came out of Billy&apos;s try-on model from one full-length photo and one listing photo.
              </p>
            </Reveal>
          </div>
          <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:px-8 xl:px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))]">
            {gallery.map(([person, id]) => {
              const item = getListing(id)!;
              return (
                <Link
                  key={`${person}-${id}`}
                  href={`/listing/${id}`}
                  className="group w-[15.5rem] shrink-0 snap-start md:w-[17rem]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-surface-2">
                    <Image
                      src={`/looks/${person}-${id}.jpg`}
                      alt={`${person === "mei" ? "Mei" : "Arjun"} wearing the ${item.title}`}
                      fill
                      sizes="272px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-3 flex items-start gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                      <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-sm text-muted">
                        {formatPrice(item.price)} · {item.kind === "pre-loved" ? "Pre-loved" : "Surplus stock"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 md:py-24 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Works on the shops you already use.</h2>
              <p className="mt-4 max-w-[46ch] text-muted">
                Billy lives in Chrome&apos;s side panel. It reads product photos from any page, so there is no new store to
                learn and no app to install on your phone.
              </p>
              <Link href="/extension" className="btn btn-ink mt-8">
                <PuzzlePiece size={16} weight="bold" />
                Add to Chrome
              </Link>
            </div>
            <ol className="space-y-14">
              {steps.map((step) => (
                <li key={step.title}>
                  <Reveal>
                  <div className="grid items-center gap-6 sm:grid-cols-[11rem_1fr] md:gap-10">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] border border-line bg-surface-2">
                      <Image src={step.image} alt={step.alt} fill sizes="176px" className="object-cover" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
                      <p className="mt-2 max-w-[48ch] leading-relaxed text-muted">{step.body}</p>
                    </div>
                  </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-24">
          <Reveal>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">Pre-loved and surplus, first.</h2>
            <p className="mt-3 max-w-[58ch] text-muted">
              The feed only lists clothes that already exist: second-hand pieces from local sellers and unsold stock
              from retailers.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
            {bento.map((id, i) => {
              const item = getListing(id)!;
              const big = i === 0;
              return (
                <Link
                  key={id}
                  href={`/listing/${id}`}
                  className={`group flex flex-col ${big ? "col-span-2 md:row-span-2" : ""}`}
                >
                  <div className={`relative overflow-hidden rounded-[20px] bg-surface-2 ${big ? "aspect-[4/5] md:aspect-auto md:flex-1" : "aspect-square"}`}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes={big ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <p className={`truncate font-medium ${big ? "text-base" : "text-sm"}`}>{item.title}</p>
                    <p className="shrink-0 text-sm">
                      {formatPrice(item.price)}
                      {item.originalPrice && (
                        <span className="ml-1.5 text-muted line-through">{formatPrice(item.originalPrice)}</span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-muted">
                    {item.kind === "pre-loved" ? "Pre-loved" : "Surplus stock"} · {item.seller}
                  </p>
                </Link>
              );
            })}
          </div>
          <Link href="/discover" className="btn btn-ghost mt-10">
            Browse all {catalogue.length} pieces
            <ArrowRight size={16} weight="bold" />
          </Link>
        </section>

        <section id="sellers" className="scroll-mt-16 border-t border-line bg-accent-soft">
          <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-24">
            <Reveal>
              <h2 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
                Selling pre-loved pieces or unsold stock?
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-12">
              <p className="leading-relaxed">
                <span className="font-semibold">Shoppers try before they message.</span>{" "}
                <span className="text-muted">
                  Every listing in the feed can be tried on, so the buyers who reach out have already seen it on
                  themselves.
                </span>
              </p>
              <p className="leading-relaxed">
                <span className="font-semibold">You keep your own listing.</span>{" "}
                <span className="text-muted">
                  Billy sends people to your existing page on a resale app or your store. Nothing to migrate.
                </span>
              </p>
              <p className="leading-relaxed">
                <span className="font-semibold">Pay only on a sale.</span>{" "}
                <span className="text-muted">
                  Billy earns a referral fee when a purchase goes through, or a flat partnership fee for retailers
                  clearing surplus.
                </span>
              </p>
            </div>
            <Link href="/listing/olive-overshirt" className="btn btn-ink mt-12">
              See a listing page
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
