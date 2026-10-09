"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Trash, X } from "@phosphor-icons/react";
import { formatPrice, getListing } from "@/lib/catalogue";
import type { Look } from "@/lib/client/store";

const VERDICT_LABEL = { yes: "Would buy", maybe: "Maybe", no: "Wouldn't buy" } as const;

export function LooksShelf({ looks, onChange }: { looks: Look[]; onChange: (next: Look[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s.slice(-1), id]));
  }

  const pair = selected.map((id) => looks.find((l) => l.id === id)).filter(Boolean) as Look[];
  const counts = looks.reduce(
    (acc, l) => (l.verdict ? { ...acc, [l.verdict]: acc[l.verdict] + 1 } : acc),
    { yes: 0, maybe: 0, no: 0 },
  );

  return (
    <section aria-labelledby="looks-heading" className="mt-16 border-t border-line pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="looks-heading" className="text-2xl font-semibold tracking-tight">
            Saved looks
          </h2>
          <p className="mt-1 text-sm text-muted">
            {looks.length === 0
              ? "Looks you save appear here. Save two and compare them side by side."
              : `${looks.length} saved · ${counts.yes} would buy · ${counts.maybe} maybe · ${counts.no} wouldn't`}
          </p>
        </div>
        {looks.length > 1 && (
          <button onClick={() => setComparing(true)} disabled={pair.length !== 2} className="btn btn-ink">
            {pair.length === 2 ? "Compare 2 looks" : `Select ${2 - pair.length} to compare`}
          </button>
        )}
      </div>

      {looks.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {looks.map((look) => {
            const isSelected = selected.includes(look.id);
            return (
              <li key={look.id}>
                <button
                  onClick={() => toggle(look.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select ${look.garment.title} to compare`}
                  className={`relative block aspect-[3/4] w-full overflow-hidden rounded-[20px] border-2 bg-surface-2 transition-colors ${
                    isSelected ? "border-accent" : "border-transparent hover:border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={look.image} alt="" className="size-full object-cover" />
                </button>
                <div className="mt-2 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{look.garment.title}</p>
                    <p className="text-[0.8125rem] text-muted">
                      {[look.garment.price ? formatPrice(look.garment.price) : null, look.verdict ? VERDICT_LABEL[look.verdict] : null]
                        .filter(Boolean)
                        .join(" · ") || new Date(look.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelected((s) => s.filter((x) => x !== look.id));
                      onChange(looks.filter((l) => l.id !== look.id));
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                    aria-label={`Delete ${look.garment.title}`}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {comparing && pair.length === 2 && <CompareModal looks={pair} onClose={() => setComparing(false)} />}
    </section>
  );
}

function CompareModal({ looks, onClose }: { looks: Look[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0c0c0b]/65 p-4 backdrop-blur-sm" role="dialog" aria-modal aria-label="Compare looks" onClick={onClose}>
      <div className="mx-auto my-8 max-w-4xl rounded-[20px] bg-surface p-5 shadow-lift sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Side by side</h2>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5">
          {looks.map((look) => {
            const listing = look.garment.listingId ? getListing(look.garment.listingId) : undefined;
            return (
              <div key={look.id} className="min-w-0">
                <div className="aspect-[3/4] overflow-hidden rounded-[20px] bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={look.image} alt={`Look with the ${look.garment.title}`} className="size-full object-cover" />
                </div>
                <p className="mt-3 truncate font-medium">{look.garment.title}</p>
                <p className="text-sm text-muted">
                  {listing
                    ? `${formatPrice(listing.price)} · ${listing.kind === "pre-loved" ? "Pre-loved" : "Surplus stock"} · ${listing.condition}`
                    : "From your own photo"}
                </p>
                {look.verdict && <p className="mt-1 text-sm">{VERDICT_LABEL[look.verdict]}</p>}
                {listing && (
                  <Link href={`/listing/${listing.id}`} className="btn btn-ghost btn-sm mt-3">
                    View listing
                    <ArrowUpRight size={14} weight="bold" />
                  </Link>
                )}
                {!listing && look.garment.sourceUrl && (
                  <a href={look.garment.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm mt-3">
                    Back to shop
                    <ArrowUpRight size={14} weight="bold" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
