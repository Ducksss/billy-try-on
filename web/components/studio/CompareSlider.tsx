"use client";

import { useState } from "react";
import { ArrowsLeftRight } from "@phosphor-icons/react";

// Before/after wipe: `split` is how much of the original photo shows from the left.
// The invisible range input carries pointer, keyboard and screen-reader control.
export function CompareSlider({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [split, setSplit] = useState(0);
  const knob = `clamp(1.25rem, ${split}%, calc(100% - 1.25rem))`;

  return (
    <div className="absolute inset-0 select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={alt} className="absolute inset-0 size-full object-cover" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        draggable={false}
      />
      {split > 0 && <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-surface/90" style={{ left: `${split}%` }} />}
      <div
        className="pointer-events-none absolute top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface text-ink shadow-lift"
        style={{ left: knob }}
      >
        <ArrowsLeftRight size={16} weight="bold" />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        aria-label="Compare with your original photo"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
