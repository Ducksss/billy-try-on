"use client";

import Image from "next/image";
import Link from "next/link";
import { CoatHanger } from "@phosphor-icons/react";
import { markdown, shopLabel, shopPrice, type ShopProduct } from "@/lib/shop";
import { useShop } from "./ShopProvider";

export function ProductCard({ product: p, sizes }: { product: ShopProduct; sizes: string }) {
  const { tries, openTryOn } = useShop();
  const mine = tries[p.id];
  const off = markdown(p);
  const { price, originalPrice } = p.listing;

  return (
    <li>
      <div className="group relative aspect-[3/4] overflow-hidden bg-surface-2">
        <Link href={`/shop/${p.id}`} className="absolute inset-0" aria-label={p.name}>
          {mine ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mine} alt={`You wearing the ${p.name}`} className="absolute inset-0 size-full object-cover" />
          ) : (
            <Image src={p.look} alt={`${p.model === "mei" ? "Mei" : "Arjun"} wearing the ${p.name}`} fill sizes={sizes} className="object-cover" />
          )}
          <Image
            src={mine ? p.look : p.flat}
            alt=""
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </Link>
        {mine && (
          <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 font-sans text-[11px] font-medium transition-opacity group-hover:opacity-0">
            <span className="size-1.5 rounded-full bg-accent" />
            On you
          </span>
        )}
        <button
          onClick={() => openTryOn(p.id)}
          className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 font-sans text-[12px] font-semibold text-accent-ink shadow-lift transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100"
        >
          <CoatHanger size={14} weight="bold" />
          {mine ? "Try again" : "Try on"}
        </button>
      </div>
      <Link href={`/shop/${p.id}`} className="shop-caps mt-2 flex items-start justify-between gap-3 font-narrow text-[12px]">
        <span>{p.name}</span>
        <span className="shrink-0 text-right">
          {shopPrice(price)}
          {originalPrice && <s className="block text-muted">{shopPrice(originalPrice)}</s>}
        </span>
      </Link>
      <p className="shop-caps mt-0.5 font-narrow text-[11px] text-muted">
        {shopLabel(p)}
        {off ? ` · −${off}%` : ""}
      </p>
    </li>
  );
}
