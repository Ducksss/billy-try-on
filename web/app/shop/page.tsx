import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { TryOnButton } from "@/components/shop/TryOnButton";
import { sectionProducts, type ShopSection } from "@/lib/shop";

const GRID_SIZES = "(min-width: 1024px) 33vw, 50vw";

function Section({ id, title }: { id: ShopSection; title: string }) {
  const products = sectionProducts(id);
  return (
    <section id={id} className="scroll-mt-16 px-3 pb-20 pt-16 md:px-6">
      <div className="flex items-end justify-between gap-6 border-b border-ink pb-3">
        <h2 className="font-display text-[clamp(3rem,8vw,6.5rem)] italic leading-[0.85]">{title}</h2>
        <p className="shop-caps text-[12px] text-muted">{products.length} pieces</p>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-x-2 gap-y-8 md:gap-x-3 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} sizes={GRID_SIZES} />
        ))}
      </ul>
    </section>
  );
}

export default function ShopHome() {
  return (
    <>
      <div className="relative">
        <section className="relative h-[calc(100svh-2rem)] min-h-[36rem] overflow-hidden bg-surface-2">
          <div className="absolute inset-0 grid md:grid-cols-2">
            <div className="relative">
              <Image
                src="/looks/mei-gingham-dress.jpg"
                alt="Mei wearing the gingham midi sundress"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover object-top"
              />
            </div>
            <div className="relative hidden md:block">
              <Image
                src="/looks/arjun-windbreaker-90s.jpg"
                alt="Arjun wearing the colour-block windbreaker"
                fill
                priority
                sizes="50vw"
                className="object-cover object-top"
              />
            </div>
          </div>
          <p
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-[1.5vw] select-none text-center font-display text-[25vw] font-medium leading-[0.8] tracking-[0.02em] md:text-[21vw]"
          >
            ÉTAGE
          </p>
        </section>
        {/* Beside the model on wide screens; a white band under the photos elsewhere. */}
        <div className="px-3 py-10 md:px-6 xl:absolute xl:bottom-[20vw] xl:left-6 xl:max-w-[12rem] xl:p-0">
          <p className="shop-caps text-[12px]">Pre-owned and last season</p>
          <h1 className="mt-2 font-display text-[clamp(2rem,6vw,3rem)] italic leading-[1.02] xl:text-[2.6vw]">
            Try every piece on before it&apos;s yours.
          </h1>
          <div className="shop-caps mt-4 flex gap-5 text-[12px]">
            <Link href="#woman" className="border-b border-ink pb-0.5">
              Shop woman
            </Link>
            <Link href="#man" className="border-b border-ink pb-0.5">
              Shop man
            </Link>
          </div>
        </div>
      </div>

      <Section id="woman" title="Woman" />

      <section className="grid border-y border-line md:grid-cols-[1fr_1fr_minmax(0,1.1fr)]" aria-labelledby="try-heading">
        <figure className="relative aspect-[3/4] bg-surface-2">
          <Image src="/models/arjun.jpg" alt="Arjun's own photo" fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover" />
          <figcaption className="shop-caps absolute left-3 top-3 text-[11px]">His photo</figcaption>
        </figure>
        <figure className="relative aspect-[3/4] bg-surface-2">
          <Image
            src="/looks/arjun-olive-overshirt.jpg"
            alt="The same photo with Arjun wearing the utility overshirt"
            fill
            sizes="(min-width: 768px) 33vw, 50vw"
            className="object-cover"
          />
          <figcaption className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 font-sans text-[11px] font-medium">
            <span className="size-1.5 rounded-full bg-accent" />
            On him, 10 seconds later
          </figcaption>
        </figure>
        <div className="col-span-2 flex flex-col justify-center gap-5 px-3 py-12 md:col-span-1 md:px-10">
          <p className="shop-caps text-[12px] text-muted">Try-on by Billy</p>
          <h2 id="try-heading" className="font-display text-[clamp(2.25rem,4vw,3.5rem)] italic leading-[1]">
            See it on you, not on the model.
          </h2>
          <p className="max-w-[40ch] font-sans text-[15px] leading-relaxed text-muted">
            Press Try on on any piece. Billy dresses your own photo in it, so you can see how it sits before you order.
            Your photo stays in your browser.
          </p>
          <TryOnButton id="olive-overshirt" label="Try on the utility overshirt" className="inline-flex self-start px-5 py-3 text-[14px]" />
        </div>
      </section>

      <Section id="man" title="Man" />
    </>
  );
}
