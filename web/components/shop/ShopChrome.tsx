"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShop } from "./ShopProvider";

// The home page lays the header over the hero, where the giant wordmark stands in for
// the logo. Every other page gets a solid sticky header with the small wordmark.
export function ShopHeader() {
  const home = usePathname() === "/shop";
  const { bag, openBag } = useShop();
  return (
    <header
      className={
        home ? "absolute inset-x-0 top-8 z-20" : "sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur-sm"
      }
    >
      <div className="shop-caps grid h-14 grid-cols-[1fr_auto_1fr] items-center px-3 font-narrow text-[12px] md:px-6">
        <nav className="flex gap-5" aria-label="Departments">
          <Link href="/shop#woman" className="underline-offset-4 hover:underline">
            Woman
          </Link>
          <Link href="/shop#man" className="underline-offset-4 hover:underline">
            Man
          </Link>
        </nav>
        {home ? (
          <span />
        ) : (
          <Link href="/shop" className="font-display text-[26px] font-medium leading-none tracking-[0.08em]" aria-label="ÉTAGE home">
            ÉTAGE
          </Link>
        )}
        <button onClick={openBag} className="justify-self-end underline-offset-4 hover:underline">
          Bag ({bag.length})
        </button>
      </div>
    </header>
  );
}
