import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBuy } from "@/components/shop/ProductBuy";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { getShopProduct, sectionProducts, shopProducts } from "@/lib/shop";

const CATEGORY = { top: "Tops", outerwear: "Jackets", dress: "Dresses", bottom: "Trousers" } as const;

export function generateStaticParams() {
  return shopProducts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[id]">): Promise<Metadata> {
  const p = getShopProduct((await params).id);
  return { title: p?.name ?? "Product" };
}

export default function ShopProductPage({ params }: PageProps<"/shop/[id]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="animate-pulse px-3 pt-4 md:px-6">
      <div className="mb-4 h-3 w-28 bg-surface-2" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12 xl:gap-20">
        <div className="grid gap-1 lg:grid-cols-2">
          <div className="aspect-[3/4] bg-surface-2" />
          <div className="hidden aspect-[3/4] bg-surface-2 lg:block" />
        </div>
        <div className="space-y-3">
          <div className="h-3 w-24 bg-surface-2" />
          <div className="h-4 w-56 bg-surface-2" />
          <div className="h-4 w-20 bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

async function ProductContent({ params }: { params: PageProps<"/shop/[id]">["params"] }) {
  const p = getShopProduct((await params).id);
  if (!p) notFound();
  const related = sectionProducts(p.section)
    .filter((x) => x.id !== p.id)
    .slice(0, 4);

  return (
    <div className="px-3 pb-28 pt-4 md:px-6 lg:pb-20">
      <nav className="shop-caps mb-4 text-[11px] text-muted" aria-label="Breadcrumb">
        <Link href={`/shop#${p.section}`} className="hover:text-ink">
          {p.section === "woman" ? "Woman" : "Man"}
        </Link>
        <span className="mx-2">/</span>
        <span>{CATEGORY[p.listing.category]}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12 xl:gap-20">
        <ProductGallery product={p} />
        <ProductBuy product={p} />
      </div>
      <section className="mt-20" aria-labelledby="related-heading">
        <h2 id="related-heading" className="shop-caps border-b border-ink pb-3 text-[13px] font-medium">
          You may also like
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-x-2 gap-y-8 md:gap-x-3 lg:grid-cols-4">
          {related.map((r) => (
            <ProductCard key={r.id} product={r} sizes="(min-width: 1024px) 25vw, 50vw" />
          ))}
        </ul>
      </section>
    </div>
  );
}
