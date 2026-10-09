"use client";

import { useState } from "react";
import Image from "next/image";
import type { ShopProduct } from "@/lib/shop";
import { useShop } from "./ShopProvider";
import { TryOnButton } from "./TryOnButton";

// Once the shopper has tried the piece on, the main image shows them instead of the
// model, with a switch back.
export function ProductGallery({ product: p }: { product: ShopProduct }) {
  const { tries } = useShop();
  const mine = tries[p.id];
  const [showModel, setShowModel] = useState(false);
  const yours = mine && !showModel;
  const modelName = p.model === "mei" ? "Mei" : "Arjun";

  return (
    <div className="no-scrollbar -mx-3 flex snap-x snap-mandatory overflow-x-auto md:-mx-6 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-1 lg:overflow-visible">
      <figure className="relative aspect-[3/4] w-full shrink-0 snap-start bg-surface-2">
        {yours ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mine} alt={`You wearing the ${p.name}`} className="absolute inset-0 size-full object-cover" />
        ) : (
          <Image src={p.look} alt={`${modelName} wearing the ${p.name}`} fill priority sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
        )}
        {mine ? (
          <div className="absolute left-3 top-3 flex rounded-full bg-white/90 p-1 font-sans text-[12px] font-medium backdrop-blur" role="radiogroup" aria-label="Show">
            {(
              [
                [false, "You"],
                [true, modelName],
              ] as const
            ).map(([model, label]) => (
              <button
                key={label}
                role="radio"
                aria-checked={showModel === model}
                onClick={() => setShowModel(model)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors ${showModel === model ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
              >
                {!model && <span className="size-1.5 rounded-full bg-accent" />}
                {label}
              </button>
            ))}
          </div>
        ) : (
          <TryOnButton id={p.id} label="See it on you" className="absolute bottom-4 left-4 hidden px-4 py-2.5 text-[13px] shadow-lift lg:inline-flex" />
        )}
        <figcaption className="sr-only">{yours ? "Your try-on, made with Billy" : `${modelName}, an AI-generated model`}</figcaption>
      </figure>
      <figure className="relative aspect-[3/4] w-full shrink-0 snap-start bg-surface-2">
        <Image src={p.flat} alt={p.name} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
      </figure>
    </div>
  );
}
