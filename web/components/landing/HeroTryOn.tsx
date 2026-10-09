"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, HandGrabbing } from "@phosphor-icons/react";
import { catalogue, formatPrice } from "@/lib/catalogue";

const people = {
  mei: { name: "Mei", garments: ["denim-trucker", "cable-cardigan", "black-blazer", "gingham-dress"] },
  arjun: { name: "Arjun", garments: ["windbreaker-90s", "olive-overshirt", "rust-cord-shirt", "linen-camp-shirt"] },
} as const;
type PersonId = keyof typeof people;

// Pre-rendered looks from /api/try-on, so the landing demo is instant and free to run.
export function HeroTryOn() {
  const reduce = useReducedMotion();
  const [person, setPerson] = useState<PersonId>("mei");
  const [worn, setWorn] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [over, setOver] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const garments = people[person].garments.map((id) => catalogue.find((c) => c.id === id)!);

  function wear(id: string) {
    touched.current = true;
    clearTimeout(timer.current);
    if (reduce) return setWorn(id);
    setScanning(true);
    timer.current = setTimeout(() => {
      setWorn(id);
      setScanning(false);
    }, 1100);
  }

  // Play the first drop once so first-time visitors see what happens.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!touched.current) wear(people.mei.garments[0]);
    }, 1400);
    return () => {
      clearTimeout(t);
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchPerson(id: PersonId) {
    touched.current = true;
    clearTimeout(timer.current);
    setScanning(false);
    setWorn(null);
    setPerson(id);
  }

  function inFrame(x: number, y: number) {
    const r = frameRef.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  const current = worn ? garments.find((g) => g.id === worn) : undefined;

  return (
    <div className="grid w-full gap-4 sm:grid-cols-[minmax(0,1fr)_5.5rem] lg:gap-5">
      <div className="relative">
        <div
          ref={frameRef}
          className={`relative aspect-[3/4] overflow-hidden rounded-[20px] bg-surface-2 shadow-lift transition-[outline-color] duration-200 ${
            over ? "outline-2 outline-offset-4 outline-accent" : "outline-2 outline-offset-4 outline-transparent"
          }`}
        >
          {/* Every look for this model is mounted and stacked so a swap never waits on a download. */}
          {[null, ...people[person].garments].map((id) => {
            const g = id ? garments.find((x) => x.id === id) : undefined;
            const visible = worn === id;
            return (
              <Image
                key={`${person}-${id ?? "base"}`}
                src={id ? `/looks/${person}-${id}.jpg` : `/models/${person}.jpg`}
                alt={g ? `${people[person].name} wearing the ${g.title}` : `${people[person].name}, AI-generated example model`}
                aria-hidden={!visible}
                fill
                priority={!id}
                sizes="(min-width: 1280px) 22rem, (min-width: 1024px) 19rem, 90vw"
                className={`object-cover transition-opacity duration-500 motion-reduce:transition-none ${visible ? "opacity-100" : "opacity-0"}`}
              />
            );
          })}
          {scanning && <div className="scan-band pointer-events-none absolute inset-x-0 top-0 h-full" />}

          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <div className="flex rounded-full bg-surface/90 p-1 text-sm backdrop-blur" role="tablist" aria-label="Example model">
              {(Object.keys(people) as PersonId[]).map((id) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={person === id}
                  onClick={() => switchPerson(id)}
                  className={`rounded-full px-3 py-1 transition-colors ${person === id ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
                >
                  {people[id].name}
                </button>
              ))}
            </div>
            {worn && !scanning && (
              <button onClick={() => switchPerson(person)} className="btn btn-sm bg-surface/90 text-ink backdrop-blur">
                <ArrowCounterClockwise size={14} weight="bold" />
                Reset
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 min-h-[2.75rem] text-[0.8125rem] leading-snug">
          {current && !scanning ? (
            <p>
              Wearing the {current.title.toLowerCase()}, {formatPrice(current.price)}{" "}
              {current.kind === "pre-loved" ? "pre-loved" : "surplus stock"} from {current.seller}.
            </p>
          ) : (
            <p>{scanning ? "Fitting it on..." : `Drag a garment onto ${people[person].name}, or tap one.`}</p>
          )}
          <p className="text-muted">Pre-rendered examples on AI-generated models. A live try-on takes about 25 seconds.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-muted sm:justify-center">
          <HandGrabbing size={16} weight="bold" />
          <span className="sm:hidden">Drag one onto {people[person].name}</span>
          <span className="hidden sm:inline">Drag</span>
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-1">
          {garments.map((g) => (
            <motion.button
              key={g.id}
              drag={!reduce}
              dragSnapToOrigin
              dragElastic={0.6}
              whileDrag={{ scale: 1.08, zIndex: 20, rotate: -3 }}
              onDrag={(_, info) => setOver(inFrame(info.point.x - window.scrollX, info.point.y - window.scrollY))}
              onDragEnd={(_, info) => {
                setOver(false);
                if (inFrame(info.point.x - window.scrollX, info.point.y - window.scrollY)) wear(g.id);
              }}
              onTap={() => wear(g.id)}
              aria-label={`Try the ${g.title} on ${people[person].name}`}
              aria-pressed={worn === g.id}
              title={`${g.title}, ${formatPrice(g.price)}`}
              className={`group relative cursor-grab touch-none overflow-hidden rounded-xl border-2 bg-surface text-left active:cursor-grabbing ${
                worn === g.id ? "border-accent" : "border-line hover:border-muted"
              }`}
            >
              <div className="relative aspect-square">
                <Image src={g.image} alt="" fill sizes="96px" className="pointer-events-none object-cover" draggable={false} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
