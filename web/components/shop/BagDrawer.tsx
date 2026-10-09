"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "@phosphor-icons/react";
import { getShopProduct, shopPrice } from "@/lib/shop";
import { Drawer } from "./Drawer";
import { useShop } from "./ShopProvider";

export function BagDrawer({ onClose }: { onClose: () => void }) {
  const { bag, removeFromBag, tries } = useShop();
  const items = bag.map((item, index) => ({ ...item, index, product: getShopProduct(item.id) })).filter((i) => i.product);
  const total = items.reduce((sum, i) => sum + i.product!.listing.price, 0);

  return (
    <Drawer label="Bag" onClose={onClose}>
      <header className="flex items-center justify-between border-b border-line py-3 pl-5 pr-3">
        <p className="shop-caps font-narrow text-[13px] font-medium">Bag ({items.length})</p>
        <button onClick={onClose} className="grid size-9 place-items-center hover:bg-surface-2" aria-label="Close bag">
          <X size={18} />
        </button>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="shop-caps font-narrow text-[13px]">Your bag is empty</p>
          <button onClick={onClose} className="shop-caps border border-ink px-6 py-3 font-narrow text-[12px] hover:bg-ink hover:text-white">
            Keep shopping
          </button>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
            {items.map(({ product: p, size, index }) => (
              <li key={index} className="flex gap-4 py-4">
                <Link href={`/shop/${p!.id}`} onClick={onClose} className="relative aspect-[3/4] w-24 shrink-0 bg-surface-2">
                  {tries[p!.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tries[p!.id]} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <Image src={p!.look} alt="" fill sizes="96px" className="object-cover" />
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col font-narrow text-[12px]">
                  <p className="shop-caps font-medium">{p!.name}</p>
                  <p className="mt-1">{shopPrice(p!.listing.price)}</p>
                  <p className="mt-1 text-muted">
                    {p!.colour} · {size}
                  </p>
                  {tries[p!.id] && (
                    <p className="mt-2 flex items-center gap-1.5 font-sans text-[0.75rem] text-muted">
                      <span className="size-1.5 rounded-full bg-accent" />
                      Tried on with Billy
                    </p>
                  )}
                  <button onClick={() => removeFromBag(index)} className="shop-caps mt-auto self-start text-[11px] text-muted underline-offset-2 hover:text-ink hover:underline">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-4 font-narrow">
            <div className="shop-caps flex justify-between text-[13px] font-medium">
              <span>Total</span>
              <span>{shopPrice(total)}</span>
            </div>
            <button disabled className="shop-caps mt-4 w-full bg-ink py-3.5 text-[13px] font-medium text-white opacity-40">
              Checkout
            </button>
            <p className="mt-2 text-center text-[12px] text-muted">Checkout is switched off in this demo store.</p>
          </div>
        </>
      )}
    </Drawer>
  );
}
