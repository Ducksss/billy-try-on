"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowCounterClockwise,
  Camera,
  Check,
  CoatHanger,
  Sparkle,
  UploadSimple,
  Warning,
  X,
} from "@phosphor-icons/react";
import { CameraModal } from "@/components/studio/CameraModal";
import { CompareSlider } from "@/components/studio/CompareSlider";
import { fetchAsDataUrl, normalizeImage } from "@/lib/client/images";
import { useQualityPreference } from "@/lib/client/prefs";
import { getLooks, getMe, saveLooks, setMe as storeMe } from "@/lib/client/store";
import { QUALITY_SECONDS, requestTryOn, type Quality } from "@/lib/client/tryon";
import { getShopProduct, pairings, shopPrice, type ShopProduct } from "@/lib/shop";
import { Drawer } from "./Drawer";
import { useShop } from "./ShopProvider";

// The photo the next try-on is rendered onto, and the store's pieces already on it.
type Base = { image: string; worn: ShopProduct[] };

type Run =
  | { status: "idle" }
  | { status: "running"; startedAt: number; quality: Quality; preview?: string }
  | { status: "done"; image: string; quality: Quality; saved?: boolean }
  | { status: "error"; message: string };

// Billy's try-on as a retailer would embed it: it keeps Billy's own look (rounded,
// orange) inside the store, and hands "Add to bag" back to the store.
export function TryOnDrawer({ productId, onClose }: { productId: string; onClose: () => void }) {
  const first = getShopProduct(productId)!;
  const { addToBag, recordTry } = useShop();
  const [quality] = useQualityPreference();
  const [me, setMe] = useState<string | null | undefined>(undefined);
  const [product, setProduct] = useState(first);
  const [base, setBase] = useState<Base | null>(null);
  const [run, setRun] = useState<Run>({ status: "idle" });
  const [size, setSize] = useState<string | null>(first.sizes.length === 1 ? first.sizes[0] : null);
  const [added, setAdded] = useState(false);
  const [sizeMissing, setSizeMissing] = useState(false);
  const [camera, setCamera] = useState(false);
  const [now, setNow] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const start = useCallback(
    async (p: ShopProduct, on: Base, q: Quality) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setProduct(p);
      setBase(on);
      setSize(p.sizes.length === 1 ? p.sizes[0] : null);
      setAdded(false);
      setSizeMissing(false);
      setRun({ status: "running", startedAt: Date.now(), quality: q });
      try {
        const res = await requestTryOn(on.image, { listingId: p.id }, {
          signal: controller.signal,
          quality: q,
          onPartial: (preview) => {
            if (abortRef.current === controller) setRun((r) => (r.status === "running" ? { ...r, preview } : r));
          },
        });
        setRun({ status: "done", image: res.image, quality: q });
        if (!on.worn.length) recordTry(p.id, res.image);
      } catch (err) {
        if (controller.signal.aborted) return;
        setRun({ status: "error", message: err instanceof Error ? err.message : "Try-on failed." });
      }
    },
    [recordTry],
  );

  // Opening the drawer starts the try-on straight away when Billy already has a photo.
  useEffect(() => {
    getMe().then((v) => {
      setMe(v ?? null);
      if (v) start(first, { image: v, worn: [] }, quality);
    });
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (run.status !== "running") return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [run.status]);

  async function choosePhoto(source: Blob | string) {
    const dataUrl = typeof source === "string" ? await fetchAsDataUrl(source) : await normalizeImage(source);
    await storeMe(dataUrl);
    setMe(dataUrl);
    start(product, { image: dataUrl, worn: [] }, quality);
  }

  function add() {
    if (!size) return setSizeMissing(true);
    addToBag({ id: product.id, size });
    setAdded(true);
  }

  async function save() {
    if (run.status !== "done" || run.saved) return;
    const pieces = [...(base?.worn ?? []), product];
    await saveLooks([
      {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        image: run.image,
        garment: { title: pieces.map((p) => p.name).join(" + "), image: product.flat, listingId: product.id, price: product.listing.price },
      },
      ...(await getLooks()),
    ]);
    setRun({ ...run, saved: true });
  }

  const running = run.status === "running";
  const elapsed = running ? Math.max(0, Math.round((now - run.startedAt) / 1000)) : 0;
  const expected = running ? QUALITY_SECONDS[run.quality] : 0;
  const { price, originalPrice } = product.listing;
  const nextPieces = run.status === "done" ? pairings(product, base?.worn.map((p) => p.id)).slice(0, 4) : [];

  return (
    <Drawer label={`Try on the ${product.name}`} onClose={onClose}>
      <header className="flex items-center justify-between border-b border-line py-3 pl-5 pr-3 font-sans">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight" target="_blank">
          <span className="grid size-6 place-items-center rounded-full bg-accent text-accent-ink">
            <CoatHanger size={14} weight="bold" />
          </span>
          billy
          <span className="font-normal text-muted">virtual try-on</span>
        </Link>
        <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Close try-on">
          <X size={18} weight="bold" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5 font-sans">
        {me === undefined && <div className="aspect-[3/4] animate-pulse rounded-[20px] bg-surface-2" />}

        {me === null && (
          <div className="flex flex-col gap-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-surface-2">
              <Image src={product.flat} alt="" fill sizes="28rem" className="object-cover object-top" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">See it on you first</h2>
              <p className="mt-2 text-muted">
                Add a full-length photo of yourself and Billy puts the {product.name.toLowerCase()} on you in about{" "}
                {QUALITY_SECONDS[quality]} seconds. The photo stays in this browser.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => photoInput.current?.click()} className="btn btn-primary">
                <UploadSimple size={16} weight="bold" />
                Upload photo
              </button>
              <button onClick={() => setCamera(true)} className="btn btn-ghost">
                <Camera size={16} weight="bold" />
                Use camera
              </button>
            </div>
            <div>
              <p className="text-sm text-muted">Or borrow an AI-generated model</p>
              <div className="mt-3 flex gap-3">
                {(
                  [
                    ["/models/mei.jpg", "Mei"],
                    ["/models/arjun.jpg", "Arjun"],
                  ] as const
                ).map(([src, name]) => (
                  <button key={name} onClick={() => choosePhoto(src)} className="group w-20 text-left">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl border-2 border-transparent bg-surface-2 transition-colors group-hover:border-accent">
                      <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                    </div>
                    <p className="mt-1 text-sm font-medium">{name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {me && (
          <>
            <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-surface-2">
              {run.status === "done" && base ? (
                <CompareSlider
                  before={base.image}
                  after={run.image}
                  alt={`You wearing the ${product.name.toLowerCase()}`}
                  beforeLabel={base.worn.length ? "Before this layer" : "Your photo"}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={base?.image ?? me} alt="Your photo" className="absolute inset-0 size-full object-cover" />
              )}
              {running && (
                <>
                  {run.preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={run.preview.length}
                      src={run.preview}
                      alt=""
                      className="absolute inset-0 size-full animate-[billy-fade_0.6s_ease-out] object-cover"
                    />
                  )}
                  <div className={`scan-band pointer-events-none absolute inset-x-0 top-0 h-full ${run.preview ? "opacity-40" : ""}`} />
                  <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-surface/95 p-3 backdrop-blur" role="status">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {run.preview ? "Adding the finishing details" : `Putting the ${product.name.toLowerCase()} on you`}
                      </p>
                      <p className="text-[0.8125rem] text-muted tabular-nums">
                        {elapsed}s · {elapsed <= expected + 5 ? `usually about ${expected}s` : "almost there"}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {run.status === "error" && (
                <div className="absolute inset-x-3 bottom-3 flex items-start gap-3 rounded-2xl bg-surface/95 p-3 backdrop-blur" role="alert">
                  <Warning size={20} weight="bold" className="mt-0.5 shrink-0 text-accent" />
                  <p className="flex-1 text-sm leading-snug">{run.message}</p>
                  {base && (
                    <button onClick={() => start(product, base, quality)} className="btn btn-ghost btn-sm shrink-0">
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                <Image src={product.flat} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="shop-caps font-narrow text-[13px] font-medium">{product.name}</p>
                <p className="font-narrow text-[13px]">
                  {shopPrice(price)}
                  {originalPrice && <s className="ml-2 text-muted">{shopPrice(originalPrice)}</s>}
                </p>
                {base && base.worn.length > 0 && (
                  <p className="mt-0.5 text-[0.8125rem] text-muted">Over the {base.worn.map((p) => p.name.toLowerCase()).join(" and ")}</p>
                )}
              </div>
              <button onClick={() => photoInput.current?.click()} className="shrink-0 text-[0.8125rem] text-muted underline-offset-2 hover:text-ink hover:underline">
                Change photo
              </button>
            </div>

            {run.status === "done" && (
              <div className="mt-5 flex flex-col gap-4">
                <div>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Size">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        role="radio"
                        aria-checked={size === s}
                        onClick={() => {
                          setSize(s);
                          setSizeMissing(false);
                        }}
                        className={`min-w-11 border px-3 py-2 font-narrow text-[13px] transition-colors ${
                          size === s ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {sizeMissing && <p className="mt-2 text-[0.8125rem] text-accent">Choose a size first.</p>}
                </div>
                <button onClick={add} className="shop-caps w-full bg-ink py-3.5 font-narrow text-[13px] font-medium text-white transition-opacity hover:opacity-85">
                  {added ? "Added to bag" : `Add to bag · ${shopPrice(price)}`}
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  {run.saved ? (
                    <Link href="/studio#looks-heading" target="_blank" className="btn btn-ghost btn-sm">
                      <Check size={14} weight="bold" className="text-accent" />
                      Saved to Billy
                    </Link>
                  ) : (
                    <button onClick={save} className="btn btn-ghost btn-sm">
                      Save look
                    </button>
                  )}
                  {run.quality === "low" && base && (
                    <button onClick={() => start(product, base, "medium")} className="btn btn-ghost btn-sm" title="Render again with more detail, about 25s">
                      <Sparkle size={14} weight="bold" />
                      Render in detail
                    </button>
                  )}
                  {base && (
                    <button
                      onClick={() => start(product, base, run.quality)}
                      className="btn btn-ghost btn-sm btn-icon ml-auto"
                      aria-label="Generate again"
                      title="Generate again"
                    >
                      <ArrowCounterClockwise size={14} weight="bold" />
                    </button>
                  )}
                </div>

                {nextPieces.length > 0 && (
                  <div className="border-t border-line pt-4">
                    <p className="text-sm font-medium">Wear it with</p>
                    <p className="text-[0.8125rem] text-muted">Billy layers the next piece over this look.</p>
                    <ul className="mt-3 grid grid-cols-4 gap-2">
                      {nextPieces.map((p) => (
                        <li key={p.id}>
                          <button
                            onClick={() => start(p, { image: run.image, worn: [...(base?.worn ?? []), product] }, quality)}
                            className="group w-full text-left"
                            aria-label={`Wear the ${p.name} with it`}
                          >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-lg border-2 border-transparent bg-surface-2 transition-colors group-hover:border-accent">
                              <Image src={p.flat} alt="" fill sizes="96px" className="object-cover" />
                            </div>
                            <p className="mt-1 line-clamp-2 font-narrow text-[11px] uppercase leading-tight tracking-wide">{p.name}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-line px-5 py-3 font-sans text-[0.8125rem] text-muted">
        Your photo stays in this browser and is only sent to render the look.
      </footer>

      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) choosePhoto(f);
          e.target.value = "";
        }}
      />
      {camera && (
        <CameraModal
          onClose={() => setCamera(false)}
          onCapture={(blob) => {
            setCamera(false);
            choosePhoto(blob);
          }}
        />
      )}
    </Drawer>
  );
}
