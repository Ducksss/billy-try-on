"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { catalogue, formatPrice, type Listing } from "@/lib/catalogue";

type Filter = "all" | Listing["kind"];
type Category = "all" | Listing["category"];

const KIND_LABEL: Record<Filter, string> = { all: "Everything", "pre-loved": "Pre-loved", surplus: "Surplus stock" };
const CATEGORY_LABEL: Record<Category, string> = {
  all: "All types",
  top: "Tops",
  outerwear: "Layers",
  dress: "Dresses",
  bottom: "Bottoms",
};

export function DiscoverGrid() {
  const [kind, setKind] = useState<Filter>("all");
  const [category, setCategory] = useState<Category>("all");
  const items = catalogue.filter((i) => (kind === "all" || i.kind === kind) && (category === "all" || i.category === category));

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Segmented value={kind} options={KIND_LABEL} onChange={setKind} label="Source" />
        <Segmented value={category} options={CATEGORY_LABEL} onChange={setCategory} label="Type" />
        <p className="ml-auto text-sm text-muted tabular-nums" aria-live="polite">
          {items.length} {items.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-[20px] border border-dashed border-line px-6 py-16 text-center">
          <p className="font-medium">Nothing matches both filters yet.</p>
          <button
            onClick={() => {
              setKind("all");
              setCategory("all");
            }}
            className="btn btn-ghost btn-sm mt-4"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="group flex flex-col">
              <Link href={`/listing/${item.id}`} className="relative block aspect-[3/4] overflow-hidden rounded-[20px] bg-surface-2">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </Link>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <Link href={`/listing/${item.id}`} className="truncate font-medium hover:underline">
                  {item.title}
                </Link>
                <p className="shrink-0 text-sm">
                  {formatPrice(item.price)}
                  {item.originalPrice && <span className="ml-1.5 text-muted line-through">{formatPrice(item.originalPrice)}</span>}
                </p>
              </div>
              <p className="text-sm text-muted">
                {item.kind === "pre-loved" ? "Pre-loved" : "Surplus stock"} · {item.condition} · {item.size}
              </p>
              <Link href={`/studio?item=${item.id}`} className="btn btn-ghost btn-sm mt-3 self-start">
                Try it on
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="no-scrollbar flex max-w-full overflow-x-auto rounded-full border border-line bg-surface p-1 text-sm">
      {(Object.keys(options) as T[]).map((key) => (
        <button
          key={key}
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 transition-colors ${value === key ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
        >
          {options[key]}
        </button>
      ))}
    </div>
  );
}
