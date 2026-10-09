"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  CircleNotch,
  DownloadSimple,
  Record,
  ShareNetwork,
  Stop,
  UploadSimple,
  Warning,
} from "@phosphor-icons/react";
import type { RealTimeClient } from "@decartai/sdk";
import { catalogue, formatPrice, getListing, type Listing } from "@/lib/catalogue";
import { normalizeImage } from "@/lib/client/images";
import { getLooks, saveLooks, type Look } from "@/lib/client/store";
import { MIRROR_MAX_SECONDS, MIRROR_MODEL, mirrorPrompt } from "@/lib/mirror";
import type { GarmentCategory } from "@/lib/tryon/prompt";

type MirrorGarment = { id: string; title: string; image: string; category: GarmentCategory; listing?: Listing };

type Phase =
  | { name: "ready" }
  | { name: "starting"; step: "camera" | "connecting" }
  | { name: "live"; startedAt: number }
  | { name: "ended"; message: string }
  | { name: "error"; message: string };

type Clip = { url: string; blob: Blob };

const CLIP_SECONDS = 6;

const fromListing = (l: Listing): MirrorGarment => ({ id: l.id, title: l.title, image: l.image, category: l.category, listing: l });

const END_REASONS: Record<string, string> = {
  insufficient_credits: "The live mirror is out of credits for now. Try the photo studio instead.",
  session_limit: "Too many people are using the live mirror right now. Try again in a minute.",
  moderation_violation: "The mirror stopped because the video was flagged. Try again with a different background.",
};

async function garmentBlob(g: MirrorGarment) {
  const res = await fetch(g.image);
  if (!res.ok) throw new Error("Couldn't load that garment's photo.");
  return res.blob();
}

async function fetchToken() {
  const res = await fetch("/api/mirror/token", { method: "POST" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.apiKey) throw new Error(json.error ?? "Couldn't start the live mirror.");
  return json.apiKey as string;
}

function describe(err: unknown) {
  if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError")) {
    return "Billy needs your camera for the live mirror. Allow camera access in the address bar, then start again.";
  }
  if (err instanceof DOMException && err.name === "NotFoundError") return "No camera found. Plug one in, or use the photo studio.";
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") return err.message;
  return "The live mirror couldn't connect. Check your connection and try again.";
}

export function Mirror({ enabled, initialItem }: { enabled: boolean; initialItem?: string }) {
  const [phase, setPhase] = useState<Phase>({ name: "ready" });
  const [garment, setGarment] = useState<MirrorGarment>(() => fromListing(getListing(initialItem ?? "") ?? catalogue[0]));
  const [uploads, setUploads] = useState<MirrorGarment[]>([]);
  const [swapping, setSwapping] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [recordingUntil, setRecordingUntil] = useState<number | null>(null);
  const [clip, setClip] = useState<Clip | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const rtRef = useRef<RealTimeClient | null>(null);
  const cameraRef = useRef<MediaStream | null>(null);
  const remoteRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  function stopAll() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    rtRef.current?.disconnect();
    rtRef.current = null;
    cameraRef.current?.getTracks().forEach((t) => t.stop());
    cameraRef.current = null;
    remoteRef.current = null;
    setReconnecting(false);
  }

  function end(message: string) {
    stopAll();
    setPhase({ name: "ended", message });
  }

  async function start() {
    setNotice(null);
    setPhase({ name: "starting", step: "camera" });
    try {
      // The SDK (and LiveKit under it) only loads once someone actually starts a session.
      const { createDecartClient, models } = await import("@decartai/sdk");
      const model = models.realtime(MIRROR_MODEL);
      const camera = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: model.width }, height: { ideal: model.height }, frameRate: model.fps },
      });
      cameraRef.current = camera;
      if (localVideo.current) localVideo.current.srcObject = camera;
      setPhase({ name: "starting", step: "connecting" });

      const client = createDecartClient({ apiKeyProvider: fetchToken });
      const rt = await client.realtime.connect(camera, {
        model,
        mirror: "auto",
        onRemoteStream: (stream) => {
          remoteRef.current = stream;
          if (remoteVideo.current) remoteVideo.current.srcObject = stream;
        },
        initialState: {
          image: await garmentBlob(garment),
          prompt: { text: mirrorPrompt(garment.category, garment.title), enhance: false },
        },
      });
      // The shopper may have left the page or pressed Stop while we were connecting.
      if (phaseRef.current.name !== "starting") {
        rt.disconnect();
        return;
      }
      rtRef.current = rt;
      rt.on("connectionChange", (state) => setReconnecting(state === "reconnecting"));
      rt.on("sessionEnded", ({ reason }) =>
        end(END_REASONS[reason] ?? "The live mirror session ended. Start again whenever you're ready."),
      );
      rt.on("error", (err) => console.warn("[mirror]", err.code, err.message));
      setPhase({ name: "live", startedAt: Date.now() });
    } catch (err) {
      stopAll();
      setPhase({ name: "error", message: describe(err) });
    }
  }

  async function wear(g: MirrorGarment) {
    setGarment(g);
    const rt = rtRef.current;
    if (phase.name !== "live" || !rt) return;
    setSwapping(true);
    try {
      await rt.set({ image: await garmentBlob(g), prompt: mirrorPrompt(g.category, g.title), enhance: false });
    } catch {
      setNotice("Couldn't switch to that garment. Pick it again.");
    } finally {
      setSwapping(false);
    }
  }

  async function addUpload(file: File) {
    const image = await normalizeImage(file);
    const g: MirrorGarment = {
      id: `upload-${Date.now()}`,
      title: file.name.replace(/\.[a-z]+$/i, "").replace(/[-_]+/g, " ") || "Your garment",
      image,
      category: "auto",
    };
    setUploads((u) => [g, ...u]);
    wear(g);
  }

  function record() {
    const stream = remoteRef.current;
    if (!stream || recorderRef.current?.state === "recording") return;
    const mimeType = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      setRecordingUntil(null);
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
      setClip((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { blob, url: URL.createObjectURL(blob) };
      });
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecordingUntil(Date.now() + CLIP_SECONDS * 1000);
    setTimeout(() => recorder.state === "recording" && recorder.stop(), CLIP_SECONDS * 1000);
  }

  async function snapshot() {
    const video = remoteVideo.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const look: Look = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      image: canvas.toDataURL("image/jpeg", 0.9),
      garment: {
        title: garment.title,
        image: garment.listing ? garment.image : await normalizeImage(await garmentBlob(garment), 320),
        listingId: garment.listing?.id,
        price: garment.listing?.price,
      },
    };
    await saveLooks([look, ...(await getLooks())]);
    setNotice("Saved to your looks in the studio.");
  }

  async function shareClip() {
    if (!clip) return;
    const ext = clip.blob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([clip.blob], `billy-mirror.${ext}`, { type: clip.blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "My Billy try-on", text: `Would you buy this ${garment.title.toLowerCase()}?` }).catch(() => {});
    } else {
      downloadClip();
    }
  }

  function downloadClip() {
    if (!clip) return;
    const a = document.createElement("a");
    a.href = clip.url;
    a.download = `billy-mirror-${Date.now()}.${clip.blob.type.includes("mp4") ? "mp4" : "webm"}`;
    a.click();
  }

  // Tick the session clock, and end the session at the cap even if the server is slow to.
  useEffect(() => {
    if (phase.name !== "live" && recordingUntil === null) return;
    const t = setInterval(() => {
      const at = Date.now();
      setNow(at);
      const p = phaseRef.current;
      if (p.name === "live" && at - p.startedAt >= MIRROR_MAX_SECONDS * 1000) {
        end("That's the end of this session. Start another one whenever you like.");
      }
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.name, recordingUntil]);

  const left = phase.name === "live" ? Math.max(0, MIRROR_MAX_SECONDS - Math.floor((Math.max(now, phase.startedAt) - phase.startedAt) / 1000)) : 0;

  // Streaming is billed per second: stop when the tab is hidden or the page closes.
  useEffect(() => {
    function onVisibility() {
      if (document.hidden && (phaseRef.current.name === "live" || phaseRef.current.name === "starting")) {
        end("Paused because you switched tabs. Start again when you're back.");
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const live = phase.name === "live";
  const recording = recordingUntil !== null;
  const garments = [...uploads, ...catalogue.map(fromListing)];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 md:px-8">
      <div className={`grid gap-8 lg:gap-10 ${enabled ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : "mx-auto max-w-4xl"}`}>
        <section aria-label="Live mirror" className="min-w-0">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-surface-2 shadow-lift sm:aspect-video">
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 size-full -scale-x-100 object-cover ${phase.name === "starting" ? "" : "hidden"}`}
            />
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              muted
              aria-label={`Live video of you wearing the ${garment.title}`}
              className={`absolute inset-0 size-full object-cover ${live ? "" : "hidden"}`}
            />

            {!enabled && (
              <Panel title="The live mirror isn't switched on here yet">
                <p className="max-w-[46ch] text-muted">
                  The photo studio works the same way with a single photo, and takes about 10 seconds a look.
                </p>
                {process.env.NODE_ENV === "development" && (
                  <p className="max-w-[46ch] text-sm text-muted">
                    Developer note: add <code className="font-mono text-ink">DECART_API_KEY</code> to{" "}
                    <code className="font-mono text-ink">web/.env.local</code> and restart the dev server.
                  </p>
                )}
                <Link href="/studio" className="btn btn-primary self-start">
                  Open the studio
                  <ArrowRight size={16} weight="bold" />
                </Link>
              </Panel>
            )}

            {enabled && phase.name === "ready" && (
              <Panel title="See it on you, live">
                <p className="max-w-[48ch] text-muted">
                  Billy streams your camera and dresses you in the {garment.title.toLowerCase()} in real time. Turn
                  around, move your arms, switch garments on the right.
                </p>
                <ul className="space-y-1 text-sm text-muted">
                  <li>Stand back so your top half (or all of you) is in frame.</li>
                  <li>Take off bulky jackets, and use a plain, well-lit background.</li>
                  <li>Sessions last up to {MIRROR_MAX_SECONDS / 60} minutes. Video isn&apos;t stored.</li>
                </ul>
                <button onClick={start} className="btn btn-primary self-start">
                  <Camera size={16} weight="bold" />
                  Start the mirror
                </button>
              </Panel>
            )}

            {phase.name === "starting" && (
              <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-surface/95 p-3 backdrop-blur" role="status">
                <CircleNotch size={20} weight="bold" className="animate-spin text-accent" />
                <p className="flex-1 text-sm">
                  {phase.step === "camera" ? "Opening your camera" : "Connecting to the live mirror"}
                </p>
                <button
                  onClick={() => {
                    stopAll();
                    setPhase({ name: "ready" });
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            {live && (
              <>
                <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 rounded-full bg-surface/90 px-3 py-1.5 text-sm font-medium tabular-nums backdrop-blur" role="status">
                    <span className={`size-2 rounded-full ${reconnecting ? "bg-muted" : "bg-accent"}`} />
                    {reconnecting ? "Reconnecting" : "Live"} · {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} left
                  </span>
                  {recording && (
                    <span className="flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink tabular-nums">
                      <Record size={14} weight="fill" />
                      Recording {Math.max(0, Math.ceil(((recordingUntil ?? 0) - now) / 1000))}s
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-surface/90 p-2.5 backdrop-blur">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={garment.image} alt="" className="size-full object-cover" />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {swapping ? `Switching to the ${garment.title.toLowerCase()}` : garment.title}
                  </p>
                  {garment.listing && (
                    <Link href={`/listing/${garment.listing.id}`} className="btn btn-ghost btn-sm shrink-0" target="_blank">
                      {formatPrice(garment.listing.price)}
                    </Link>
                  )}
                </div>
              </>
            )}

            {(phase.name === "ended" || phase.name === "error") && (
              <Panel title={phase.name === "error" ? "The mirror didn't start" : "Session ended"}>
                <p className="flex max-w-[48ch] gap-2 text-muted">
                  {phase.name === "error" && <Warning size={18} weight="bold" className="mt-0.5 shrink-0 text-accent" />}
                  {phase.message}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={start} className="btn btn-primary">
                    <Camera size={16} weight="bold" />
                    Start again
                  </button>
                  <Link href="/studio" className="btn btn-ghost">
                    Use a photo instead
                  </Link>
                </div>
              </Panel>
            )}
          </div>

          {live && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={record} disabled={recording} className="btn btn-primary">
                <Record size={16} weight="fill" />
                {recording ? "Recording" : `Record a ${CLIP_SECONDS}s clip`}
              </button>
              <button onClick={snapshot} className="btn btn-ghost">
                <Camera size={16} weight="bold" />
                Save a still
              </button>
              <button onClick={() => end("You stopped the mirror. Start again whenever you like.")} className="btn btn-ghost ml-auto">
                <Stop size={16} weight="fill" />
                Stop
              </button>
            </div>
          )}
          <p className="mt-3 min-h-5 text-sm text-muted" aria-live="polite">
            {notice && (
              <>
                <Check size={14} weight="bold" className="mr-1.5 inline text-accent" />
                {notice}{" "}
                {notice.startsWith("Saved") && (
                  <Link href="/studio#looks-heading" className="font-medium text-ink underline">
                    See your looks
                  </Link>
                )}
              </>
            )}
          </p>

          {clip && (
            <div className="mt-2 flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-4 sm:flex-row sm:items-center">
              <video src={clip.url} controls loop autoPlay muted playsInline className="aspect-video w-full rounded-xl bg-surface-2 sm:w-64" />
              <div className="flex flex-1 flex-col gap-3">
                <div>
                  <p className="font-medium">Your clip is ready</p>
                  <p className="text-sm text-muted">Send it to a friend before you buy. It stays on this device.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={shareClip} className="btn btn-ink btn-sm">
                    <ShareNetwork size={14} weight="bold" />
                    Share
                  </button>
                  <button onClick={downloadClip} className="btn btn-ghost btn-sm">
                    <DownloadSimple size={14} weight="bold" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className={`min-w-0 ${enabled ? "" : "hidden"}`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">{live ? "Switch garments" : "Pick a garment"}</h2>
            <button onClick={() => uploadInput.current?.click()} className="btn btn-ghost btn-sm">
              <UploadSimple size={14} weight="bold" />
              Your own
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-x-2.5 gap-y-4">
            {garments.map((g) => {
              const active = g.id === garment.id;
              return (
                <button
                  key={g.id}
                  onClick={() => wear(g)}
                  disabled={swapping}
                  aria-pressed={active}
                  className="group text-left disabled:opacity-60"
                  aria-label={`Wear the ${g.title}`}
                >
                  <div
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-surface-2 transition-colors ${
                      active ? "border-accent" : "border-transparent group-hover:border-line"
                    }`}
                  >
                    {g.listing ? (
                      <Image src={g.image} alt="" fill sizes="112px" className="object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.image} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-[0.8125rem] font-medium">{g.title}</p>
                  <p className="text-xs text-muted">
                    {g.listing ? `${formatPrice(g.listing.price)} · ${g.listing.kind === "pre-loved" ? "Pre-loved" : "Surplus"}` : "Uploaded"}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
      <input
        ref={uploadInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addUpload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-4 overflow-y-auto bg-surface-2 p-6 sm:p-10">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {children}
    </div>
  );
}
