"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowCounterClockwise,
  ArrowUpRight,
  Camera,
  Check,
  DownloadSimple,
  HandGrabbing,
  LinkSimple,
  ShareNetwork,
  Sparkle,
  Stack,
  UploadSimple,
  VideoCamera,
  Warning,
} from "@phosphor-icons/react";
import { catalogue, formatPrice, getListing, type Listing } from "@/lib/catalogue";
import { downloadDataUrl, fetchAsDataUrl, normalizeImage, shareImage } from "@/lib/client/images";
import { useQualityPreference } from "@/lib/client/prefs";
import { getLooks, getMe, saveLooks, setMe as storeMe, type Look, type Verdict } from "@/lib/client/store";
import { QUALITY_SECONDS, requestTryOn, type GarmentRequest, type Quality } from "@/lib/client/tryon";
import { CameraModal } from "./CameraModal";
import { CompareSlider } from "./CompareSlider";
import { LooksShelf } from "./LooksShelf";

type Garment = {
  title: string;
  preview: string;
  request: GarmentRequest;
  listing?: Listing;
  sourceUrl?: string;
};

// The photo a try-on is rendered onto: the shopper's own, or a look they kept on so the
// next garment layers over it.
type Base = { image: string; layers: Garment[] };

// One finished try-on. Every result this session is kept so trying the next garment
// never throws away a look that took time (and money) to render.
type Result = {
  id: string;
  image: string;
  base: Base;
  garment: Garment;
  ms: number;
  quality: Quality;
  savedId?: string;
  verdict?: Verdict;
};

type Run =
  | { status: "idle" }
  | { status: "running"; startedAt: number; quality: Quality; preview?: string }
  | { status: "done"; id: string }
  | { status: "error"; message: string };

const LISTING_MIME = "application/x-billy-listing";
const HISTORY_LIMIT = 12;

function listingGarment(listing: Listing): Garment {
  return { title: listing.title, preview: listing.image, request: { listingId: listing.id }, listing };
}

const outfitTitle = (r: Result) => [...r.base.layers, r.garment].map((g) => g.title).join(" + ");

export function Studio({ initialItem, mirror = false }: { initialItem?: string; mirror?: boolean }) {
  const [me, setMe] = useState<string | null | undefined>(undefined);
  const [outfit, setOutfit] = useState<Base | null>(null);
  const [garment, setGarment] = useState<Garment | null>(() => {
    const listing = initialItem ? getListing(initialItem) : undefined;
    return listing ? listingGarment(listing) : null;
  });
  const [run, setRun] = useState<Run>({ status: "idle" });
  const [history, setHistory] = useState<Result[]>([]);
  const [quality, setQuality] = useQualityPreference();
  const [looks, setLooks] = useState<Look[]>([]);
  const [tab, setTab] = useState<"feed" | "yours">("feed");
  const [dragOver, setDragOver] = useState(false);
  const [camera, setCamera] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [now, setNow] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const garmentInput = useRef<HTMLInputElement>(null);
  const autoRan = useRef(false);

  const base: Base | null = me ? (outfit ?? { image: me, layers: [] }) : null;
  const current = run.status === "done" ? history.find((r) => r.id === run.id) : undefined;

  useEffect(() => {
    getMe().then((v) => setMe(v ?? null));
    getLooks().then(setLooks);
  }, []);

  const tryOn = useCallback(async (g: Garment, on: Base, q: Quality) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGarment(g);
    setRun({ status: "running", startedAt: Date.now(), quality: q });
    try {
      const res = await requestTryOn(on.image, g.request, {
        signal: controller.signal,
        quality: q,
        onPartial: (preview) => {
          if (abortRef.current === controller) setRun((r) => (r.status === "running" ? { ...r, preview } : r));
        },
      });
      const result: Result = { id: crypto.randomUUID(), image: res.image, base: on, garment: g, ms: res.ms, quality: q };
      setHistory((h) => [result, ...h].slice(0, HISTORY_LIMIT));
      setRun({ status: "done", id: result.id });
    } catch (err) {
      if (controller.signal.aborted) return;
      setRun({ status: "error", message: err instanceof Error ? err.message : "Try-on failed." });
    }
  }, []);

  // Arriving from "Try on" in the feed runs straight away once a photo exists.
  useEffect(() => {
    if (autoRan.current || !me || !garment || !initialItem) return;
    autoRan.current = true;
    tryOn(garment, { image: me, layers: [] }, quality);
  }, [me, garment, initialItem, quality, tryOn]);

  useEffect(() => {
    if (run.status !== "running") return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [run.status]);

  function choose(g: Garment) {
    if (base) tryOn(g, base, quality);
    else {
      setGarment(g);
      setRun({ status: "idle" });
    }
  }

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setRun({ status: "idle" });
  }

  async function applyPhoto(source: Blob | string) {
    const dataUrl = typeof source === "string" ? await fetchAsDataUrl(source) : await normalizeImage(source);
    await storeMe(dataUrl);
    setMe(dataUrl);
    setOutfit(null);
    setRun({ status: "idle" });
    if (garment) tryOn(garment, { image: dataUrl, layers: [] }, quality);
  }

  async function addGarmentFile(file: Blob, title = "Your garment") {
    const dataUrl = await normalizeImage(file);
    choose({
      title,
      preview: dataUrl,
      request: { image: dataUrl, title: title === "Your garment" ? undefined : title },
    });
  }

  function addGarmentUrl(url: string, pageUrl?: string) {
    let host = "the web";
    try {
      host = new URL(pageUrl ?? url).hostname.replace(/^www\./, "");
    } catch {
      return setRun({ status: "error", message: "That doesn't look like an image link." });
    }
    choose({ title: `Garment from ${host}`, preview: url, request: { url, pageUrl }, sourceUrl: pageUrl });
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const listingId = e.dataTransfer.getData(LISTING_MIME);
    const listing = listingId ? getListing(listingId) : undefined;
    if (listing) return choose(listingGarment(listing));
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
    if (file) return addGarmentFile(file, file.name.replace(/\.[a-z]+$/i, "").replace(/[-_]+/g, " "));
    const html = e.dataTransfer.getData("text/html");
    const fromHtml = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    const uri =
      fromHtml ??
      e.dataTransfer
        .getData("text/uri-list")
        .split("\n")
        .find((l) => l && !l.startsWith("#"));
    if (uri) addGarmentUrl(uri.replace(/&amp;/g, "&"));
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea")) return;
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) addGarmentFile(file, "Pasted garment");
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  function patchResult(id: string, patch: Partial<Result>) {
    setHistory((h) => h.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveLook(r: Result) {
    if (r.savedId) return;
    const g = r.garment;
    const thumb = g.preview.startsWith("data:")
      ? await normalizeImage(await (await fetch(g.preview)).blob(), 320)
      : g.preview;
    const look: Look = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      image: r.image,
      garment: {
        title: outfitTitle(r),
        image: thumb,
        listingId: g.listing?.id,
        price: g.listing?.price,
        sourceUrl: g.sourceUrl,
      },
      verdict: r.verdict,
    };
    const next = [look, ...looks];
    setLooks(next);
    await saveLooks(next);
    patchResult(r.id, { savedId: look.id });
  }

  async function pickVerdict(r: Result, v: Verdict) {
    patchResult(r.id, { verdict: v });
    if (r.savedId) {
      const next = looks.map((l) => (l.id === r.savedId ? { ...l, verdict: v } : l));
      setLooks(next);
      await saveLooks(next);
    }
  }

  function keepOn(r: Result) {
    setOutfit({ image: r.image, layers: [...r.base.layers, r.garment] });
    setGarment(null);
    setRun({ status: "idle" });
  }

  function startOver() {
    setOutfit(null);
    setGarment(null);
    setRun({ status: "idle" });
  }

  async function updateLooks(next: Look[]) {
    setLooks(next);
    await saveLooks(next);
  }

  const elapsed = run.status === "running" ? Math.max(0, Math.round((now - run.startedAt) / 1000)) : 0;
  const expected = run.status === "running" ? QUALITY_SECONDS[run.quality] : 0;
  const stageImage = base?.image;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-10">
        <section aria-label="Fitting room" className="min-w-0">
          <h1 className="sr-only">Billy studio</h1>
          <div
            onDragOver={(e) => {
              if (!me) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-[20px] bg-surface-2 shadow-lift outline-2 outline-offset-4 transition-[outline-color] ${
              history.length ? "max-w-[min(100%,calc((100dvh-14rem)*0.75))]" : "max-w-[min(100%,calc((100dvh-9rem)*0.75))]"
            } ${dragOver ? "outline-accent" : "outline-transparent"}`}
          >
            {me === undefined && <div className="absolute inset-0 animate-pulse bg-surface-2" />}

            {me === null && (
              <PhotoOnboarding
                onUpload={() => photoInput.current?.click()}
                onCamera={() => setCamera(true)}
                onExample={(src) => applyPhoto(src)}
                pending={garment?.title}
              />
            )}

            {current && (
              <CompareSlider
                key={current.id}
                before={current.base.image}
                after={current.image}
                alt={`You wearing the ${outfitTitle(current).toLowerCase()}`}
                beforeLabel={current.base.layers.length ? "Before this layer" : "Your photo"}
              />
            )}

            {stageImage && !current && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stageImage} alt="Your photo" className="absolute inset-0 size-full object-cover" draggable={false} />
            )}

            {run.status === "running" && (
              <>
                {run.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={run.preview.length}
                    src={run.preview}
                    alt=""
                    className="animate-[billy-fade_0.6s_ease-out] absolute inset-0 size-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-bg/25" />
                )}
                <div className={`scan-band pointer-events-none absolute inset-x-0 top-0 h-full ${run.preview ? "opacity-40" : ""}`} />
                <div
                  className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-surface/95 p-2.5 pr-3 backdrop-blur"
                  role="status"
                >
                  {garment && <Thumb src={garment.preview} />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {run.preview ? "Adding the finishing details" : `Fitting the ${garment?.title.toLowerCase()}`}
                    </p>
                    <p className="text-[0.8125rem] text-muted tabular-nums">
                      {elapsed}s · {elapsed <= expected + 5 ? `usually about ${expected}s` : "almost there"}
                    </p>
                  </div>
                  <button onClick={cancel} className="btn btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              </>
            )}

            {me && run.status === "idle" && (
              <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-surface/95 p-3 backdrop-blur">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  {outfit ? <Stack size={20} weight="bold" /> : <HandGrabbing size={20} weight="bold" />}
                </span>
                <p className="text-sm leading-snug">
                  {garment ? (
                    <>
                      Ready to try the <span className="font-medium">{garment.title.toLowerCase()}</span>.
                    </>
                  ) : outfit ? (
                    <>
                      <span className="font-medium">Add the next layer.</span>{" "}
                      <span className="text-muted">Drag a jacket, top or bottoms on to build the outfit.</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Drag a garment onto yourself.</span>{" "}
                      <span className="text-muted">From the feed, another tab, or paste an image.</span>
                    </>
                  )}
                </p>
                {garment && base && (
                  <button onClick={() => tryOn(garment, base, quality)} className="btn btn-primary btn-sm ml-auto">
                    Try it on
                  </button>
                )}
              </div>
            )}

            {me && run.status === "error" && (
              <div
                className="absolute inset-x-3 bottom-3 flex items-start gap-3 rounded-2xl bg-surface/95 p-3 backdrop-blur"
                role="alert"
              >
                <Warning size={20} weight="bold" className="mt-0.5 shrink-0 text-accent" />
                <p className="flex-1 text-sm leading-snug">{run.message}</p>
                {garment && base && (
                  <button onClick={() => tryOn(garment, base, quality)} className="btn btn-ghost btn-sm shrink-0">
                    Retry
                  </button>
                )}
              </div>
            )}

            {dragOver && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-accent/15">
                <span className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
                  {outfit ? "Drop to layer it on" : "Drop to try it on"}
                </span>
              </div>
            )}
          </div>

          {history.length > 0 && (
            <SessionStrip
              history={history}
              currentId={current?.id}
              onPick={(r) => {
                abortRef.current?.abort();
                setGarment(r.garment);
                setRun({ status: "done", id: r.id });
              }}
            />
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-8">
          {current && (
            <ResultPanel
              result={current}
              onSave={() => saveLook(current)}
              onVerdict={(v) => pickVerdict(current, v)}
              onKeepOn={() => keepOn(current)}
              onAgain={(q) => tryOn(current.garment, current.base, q)}
            />
          )}
          {me && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Thumb src={me} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Your photo</p>
                  <p className="text-[0.8125rem] text-muted">Saved in this browser only</p>
                </div>
                <button onClick={() => photoInput.current?.click()} className="btn btn-ghost btn-sm">
                  <UploadSimple size={14} weight="bold" />
                  Change
                </button>
                <button onClick={() => setCamera(true)} className="btn btn-ghost btn-sm" aria-label="Retake with camera">
                  <Camera size={14} weight="bold" />
                </button>
              </div>
              {outfit && (
                <div className="flex items-center gap-3 rounded-2xl bg-accent-soft p-3">
                  <div className="flex shrink-0 -space-x-3">
                    {outfit.layers.slice(-3).map((g, i) => (
                      <div key={i} className="relative size-10 overflow-hidden rounded-xl border-2 border-accent-soft bg-surface">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.preview} alt="" className="size-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      Wearing {outfit.layers.length} {outfit.layers.length === 1 ? "piece" : "pieces"}
                    </p>
                    <p className="truncate text-[0.8125rem] text-muted">{outfit.layers.map((g) => g.title).join(", ")}</p>
                  </div>
                  <button onClick={startOver} className="btn btn-ghost btn-sm shrink-0">
                    Start over
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Render</p>
                  <p className="text-[0.8125rem] text-muted">
                    {quality === "low" ? "Quick suits most garments." : "Detailed sharpens prints and texture."}
                  </p>
                </div>
                <div className="flex shrink-0 rounded-full border border-line bg-surface p-1 text-sm" role="radiogroup" aria-label="Render quality">
                  {(
                    [
                      ["low", "Quick"],
                      ["medium", "Detailed"],
                    ] as const
                  ).map(([q, label]) => (
                    <button
                      key={q}
                      role="radio"
                      aria-checked={quality === q}
                      onClick={() => setQuality(q)}
                      className={`rounded-full px-3 py-1 transition-colors ${quality === q ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
                    >
                      {label} <span className="tabular-nums opacity-70">~{QUALITY_SECONDS[q]}s</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {mirror && (
            <Link
              href={garment?.listing ? `/mirror?item=${garment.listing.id}` : "/mirror"}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-muted"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-bg">
                <VideoCamera size={20} weight="bold" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Try it live with your camera</span>
                <span className="block text-[0.8125rem] text-muted">Move, turn around, record a clip to share.</span>
              </span>
              <ArrowUpRight size={16} weight="bold" className="shrink-0 text-muted transition-colors group-hover:text-ink" />
            </Link>
          )}

          <div>
            <div
              className="flex gap-1 rounded-full border border-line bg-surface p-1 text-sm"
              role="tablist"
              aria-label="Garments"
            >
              {(
                [
                  ["feed", "Pre-loved feed"],
                  ["yours", "Your own"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${tab === id ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "feed" ? (
              <div className="mt-4 grid grid-cols-3 gap-x-2.5 gap-y-4">
                {catalogue.map((item) => {
                  const active = garment?.listing?.id === item.id;
                  const worn = outfit?.layers.some((g) => g.listing?.id === item.id);
                  return (
                    <button
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(LISTING_MIME, item.id);
                        e.dataTransfer.setData("text/uri-list", new URL(item.image, location.href).toString());
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => choose(listingGarment(item))}
                      disabled={run.status === "running"}
                      className="group text-left disabled:opacity-60"
                      aria-label={`${outfit ? "Layer on" : "Try on"} the ${item.title}, ${formatPrice(item.price)}`}
                    >
                      <div
                        className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-surface-2 transition-colors ${
                          active ? "border-accent" : "border-transparent group-hover:border-line"
                        }`}
                      >
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          sizes="128px"
                          className="pointer-events-none object-cover"
                        />
                        {worn && (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-medium text-accent-ink">
                            Wearing
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 truncate text-[0.8125rem] font-medium">{item.title}</p>
                      <p className="text-xs text-muted">
                        {formatPrice(item.price)} · {item.kind === "pre-loved" ? "Pre-loved" : "Surplus"}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <button
                  onClick={() => garmentInput.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-[20px] border-2 border-dashed border-line px-6 py-8 text-center transition-colors hover:border-muted"
                >
                  <UploadSimple size={24} weight="bold" className="text-muted" />
                  <span className="font-medium">Upload a garment photo</span>
                  <span className="text-sm text-muted">A product shot on a plain background works best.</span>
                </button>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (linkValue.trim()) addGarmentUrl(linkValue.trim());
                  }}
                  className="space-y-2"
                >
                  <label htmlFor="garment-link" className="text-sm font-medium">
                    Image link
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkSimple
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <input
                        id="garment-link"
                        type="url"
                        inputMode="url"
                        value={linkValue}
                        onChange={(e) => setLinkValue(e.target.value)}
                        placeholder="https://shop.example/jacket.jpg"
                        className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm placeholder:text-muted focus:border-ink focus:outline-none"
                      />
                    </div>
                    <button type="submit" disabled={!linkValue.trim() || !me} className="btn btn-ink btn-sm">
                      Try
                    </button>
                  </div>
                  <p className="text-[0.8125rem] text-muted">
                    Right-click a product photo and choose Copy image address. You can also drag a photo from another
                    tab straight onto yourself, or paste a copied image.
                  </p>
                </form>
              </div>
            )}
          </div>
        </aside>
      </div>

      <LooksShelf looks={looks} onChange={updateLooks} />

      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) applyPhoto(f);
          e.target.value = "";
        }}
      />
      <input
        ref={garmentInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addGarmentFile(f, f.name.replace(/\.[a-z]+$/i, "").replace(/[-_]+/g, " "));
          e.target.value = "";
        }}
      />
      {camera && (
        <CameraModal
          onClose={() => setCamera(false)}
          onCapture={(blob) => {
            setCamera(false);
            applyPhoto(blob);
          }}
        />
      )}
    </div>
  );
}

function ResultPanel({
  result,
  onSave,
  onVerdict,
  onKeepOn,
  onAgain,
}: {
  result: Result;
  onSave: () => void;
  onVerdict: (v: Verdict) => void;
  onKeepOn: () => void;
  onAgain: (q: Quality) => void;
}) {
  const [shared, setShared] = useState<"copied" | "failed" | null>(null);
  const { garment } = result;
  const title = outfitTitle(result);

  async function share() {
    try {
      const outcome = await shareImage(result.image, {
        title: "My Billy look",
        text: `Would you buy this? ${garment.title}${garment.listing ? `, ${formatPrice(garment.listing.price)}` : ""}.`,
      });
      if (outcome === "copied") setShared("copied");
    } catch {
      setShared("failed");
    }
    setTimeout(() => setShared(null), 2500);
  }

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <Thumb src={garment.preview} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" title={title}>
            {title}
          </p>
          <p className="text-sm text-muted">
            {garment.listing
              ? `${formatPrice(garment.listing.price)} · ${garment.listing.kind === "pre-loved" ? "Pre-loved" : "Surplus stock"} from ${garment.listing.seller}`
              : `${result.quality === "low" ? "Quick" : "Detailed"} render in ${(result.ms / 1000).toFixed(0)}s`}
          </p>
          {garment.listing && (
            <Link href={`/listing/${garment.listing.id}`} className="mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline">
              View listing
              <ArrowUpRight size={14} weight="bold" />
            </Link>
          )}
          {!garment.listing && garment.sourceUrl && (
            <a href={garment.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline">
              Back to shop
              <ArrowUpRight size={14} weight="bold" />
            </a>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {result.savedId ? (
          <a href="#looks-heading" className="btn btn-ghost">
            <Check size={16} weight="bold" className="text-accent" />
            Saved
          </a>
        ) : (
          <button onClick={onSave} className="btn btn-primary">
            Save look
          </button>
        )}
        <button onClick={onKeepOn} className="btn btn-ghost" title="Keep this on and layer another garment over it">
          <Stack size={16} weight="bold" />
          Keep it on
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {result.quality === "low" && (
          <button onClick={() => onAgain("medium")} className="btn btn-ghost btn-sm" title="Render again with more detail, about 25s">
            <Sparkle size={14} weight="bold" />
            Render in detail
          </button>
        )}
        <button onClick={share} className="btn btn-ghost btn-sm" aria-live="polite">
          <ShareNetwork size={14} weight="bold" />
          {shared === "copied" ? "Copied" : shared === "failed" ? "Couldn't share" : "Ask a friend"}
        </button>
        <button
          onClick={() => downloadDataUrl(result.image, `billy-look-${Date.now()}.jpg`)}
          className="btn btn-ghost btn-sm btn-icon ml-auto"
          aria-label="Download look"
          title="Download"
        >
          <DownloadSimple size={14} weight="bold" />
        </button>
        <button onClick={() => onAgain(result.quality)} className="btn btn-ghost btn-sm btn-icon" aria-label="Generate again" title="Generate again">
          <ArrowCounterClockwise size={14} weight="bold" />
        </button>
      </div>
      <fieldset className="flex flex-wrap items-center gap-3">
        <legend className="sr-only">Would you buy it?</legend>
        <span aria-hidden className="text-sm text-muted">
          Would you buy it?
        </span>
        <div className="flex rounded-full border border-line bg-surface p-1">
          {(["yes", "maybe", "no"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onVerdict(v)}
              aria-pressed={result.verdict === v}
              className={`rounded-full px-3.5 py-1 text-sm capitalize transition-colors ${
                result.verdict === v ? "bg-ink text-bg" : "text-muted hover:text-ink"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="text-[0.8125rem] text-muted">Drag the handle on the photo to compare with the original.</p>
    </div>
  );
}

function SessionStrip({
  history,
  currentId,
  onPick,
}: {
  history: Result[];
  currentId?: string;
  onPick: (r: Result) => void;
}) {
  return (
    <div className="mx-auto mt-4 flex max-w-[min(100%,calc((100dvh-14rem)*0.75))] items-center gap-3">
      <p className="shrink-0 text-[0.8125rem] leading-tight text-muted">
        This
        <br />
        session
      </p>
      <ul className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
        {history.map((r) => (
          <li key={r.id} className="shrink-0">
            <button
              onClick={() => onPick(r)}
              aria-pressed={r.id === currentId}
              aria-label={`Show the look with the ${outfitTitle(r)}`}
              title={outfitTitle(r)}
              className={`relative block h-16 w-12 overflow-hidden rounded-xl border-2 bg-surface-2 transition-colors ${
                r.id === currentId ? "border-accent" : "border-transparent hover:border-line"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.image} alt="" className="size-full object-cover" />
              {r.savedId && (
                <span className="absolute bottom-1 right-1 grid size-4 place-items-center rounded-full bg-accent text-accent-ink">
                  <Check size={10} weight="bold" />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Thumb({ src }: { src: string }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover" />
    </div>
  );
}

function PhotoOnboarding({
  onUpload,
  onCamera,
  onExample,
  pending,
}: {
  onUpload: () => void;
  onCamera: () => void;
  onExample: (src: string) => void;
  pending?: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-6 overflow-y-auto p-6 sm:p-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start with a photo of you</h2>
        <p className="mt-2 max-w-[40ch] text-muted">
          {pending ? `Then Billy will put the ${pending.toLowerCase()} on you. ` : ""}
          Full length, facing the camera, in fitted clothes. It stays in this browser.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onUpload} className="btn btn-primary">
          <UploadSimple size={16} weight="bold" />
          Upload photo
        </button>
        <button onClick={onCamera} className="btn btn-ghost">
          <Camera size={16} weight="bold" />
          Use camera
        </button>
      </div>
      <div>
        <p className="text-sm text-muted">Or borrow an AI-generated model</p>
        <div className="mt-3 flex gap-3">
          {[
            ["/models/mei.jpg", "Mei"],
            ["/models/arjun.jpg", "Arjun"],
          ].map(([src, name]) => (
            <button key={name} onClick={() => onExample(src)} className="group w-24 text-left">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border-2 border-transparent bg-surface transition-colors group-hover:border-accent">
                <Image src={src} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <p className="mt-1.5 text-sm font-medium">{name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
