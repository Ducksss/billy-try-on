"use client";

import { CoatHanger } from "@phosphor-icons/react";
import { useShop } from "./ShopProvider";

// Billy's button as a retailer would place it: rounded and orange in an otherwise
// black-and-white store.
export function TryOnButton({ id, label = "Try it on", className = "" }: { id: string; label?: string; className?: string }) {
  const { openTryOn } = useShop();
  return (
    <button
      onClick={() => openTryOn(id)}
      className={`items-center justify-center gap-2 rounded-full bg-accent font-sans font-semibold text-accent-ink transition-[transform,background-color] hover:bg-[color-mix(in_oklab,var(--accent)_88%,black)] active:scale-[0.98] ${className}`}
    >
      <CoatHanger size={16} weight="bold" />
      {label}
    </button>
  );
}
