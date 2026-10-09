"use client";

import { useState } from "react";
import { markdown, shopLabel, shopPrice, type ShopProduct } from "@/lib/shop";
import { useShop } from "./ShopProvider";
import { TryOnButton } from "./TryOnButton";

export function ProductBuy({ product: p }: { product: ShopProduct }) {
  const { addToBag, tries } = useShop();
  const single = p.sizes.length === 1;
  const [size, setSize] = useState<string | null>(single ? p.sizes[0] : null);
  const [missing, setMissing] = useState(false);
  const [added, setAdded] = useState(false);
  const off = markdown(p);
  const { price, originalPrice, condition, note } = p.listing;
  const tryLabel = tries[p.id] ? "Try it on again" : "Try it on";

  function add() {
    if (!size) {
      setMissing(true);
      document.getElementById("sizes")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    addToBag({ id: p.id, size });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <>
      <div className="font-narrow lg:sticky lg:top-20 lg:self-start">
        <p className="shop-caps text-[11px] text-muted">
          {shopLabel(p)}
          {off ? ` · −${off}%` : ""}
        </p>
        <h1 className="shop-caps mt-2 text-[16px] font-medium leading-snug">{p.name}</h1>
        <p className="mt-2 text-[15px]">
          {shopPrice(price)}
          {originalPrice && <s className="ml-3 text-muted">{shopPrice(originalPrice)}</s>}
        </p>
        <p className="mt-6 max-w-[46ch] text-[14px] leading-relaxed">{p.description}</p>
        <p className="shop-caps mt-4 text-[12px] text-muted">{p.colour}</p>

        <div className="mt-6">
          <div
            id="sizes"
            className="grid scroll-mt-24 gap-px border border-line bg-line"
            style={{ gridTemplateColumns: `repeat(${Math.min(p.sizes.length, 5)}, minmax(0, 1fr))` }}
            role="radiogroup"
            aria-label="Size"
          >
            {p.sizes.map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={size === s}
                onClick={() => {
                  setSize(s);
                  setMissing(false);
                }}
                className={`py-3 text-[13px] transition-colors ${size === s ? "bg-ink text-white" : "bg-white hover:bg-surface-2"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className={`mt-2 text-[12px] ${missing ? "text-accent" : "text-muted"}`} aria-live="polite">
            {missing ? "Choose a size first." : single ? "One piece available, in this size." : " "}
          </p>
        </div>

        <button onClick={add} className="shop-caps mt-3 hidden w-full bg-ink py-4 text-[13px] font-medium text-white transition-opacity hover:opacity-85 lg:block">
          {added ? "Added to bag" : "Add"}
        </button>
        <TryOnButton id={p.id} label={tryLabel} className="mt-2 hidden w-full py-3.5 text-[15px] lg:flex" />
        <p className="mt-2 hidden text-center font-sans text-[12px] text-muted lg:block">
          See it on your own photo in about 10 seconds, with Billy.
        </p>

        <dl className="mt-8 divide-y divide-line border-y border-line text-[13px]">
          <div className="py-3">
            <dt className="shop-caps text-[11px] text-muted">Composition</dt>
            <dd className="mt-1">{p.composition}</dd>
          </div>
          <div className="py-3">
            <dt className="shop-caps text-[11px] text-muted">Condition</dt>
            <dd className="mt-1">
              {condition}. {note}
            </dd>
          </div>
        </dl>
      </div>

      {/* Phones: the two actions stay in reach while the shopper scrolls the photos. */}
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-line bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <TryOnButton id={p.id} label={tryLabel} className="flex py-3 text-[14px]" />
        <button onClick={add} className="shop-caps bg-ink py-3 font-narrow text-[13px] font-medium text-white">
          {added ? "Added" : size ? `Add · ${size}` : "Add"}
        </button>
      </div>
    </>
  );
}
