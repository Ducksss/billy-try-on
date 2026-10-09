import type { GarmentCategory } from "@/lib/tryon/prompt";

export type GarmentRequest = {
  image?: string;
  url?: string;
  pageUrl?: string;
  title?: string;
  category?: GarmentCategory;
  listingId?: string;
};

// "low" is the quick render (about 10s), "medium" the detailed one (about 25s).
export type Quality = "low" | "medium";
export const QUALITY_SECONDS: Record<Quality, number> = { low: 10, medium: 25 };

export type TryOnResponse = { image: string; provider: string; model: string; ms: number };

type Options = { signal?: AbortSignal; quality?: Quality; onPartial?: (image: string) => void };

// Streams rough previews to `onPartial` while the look renders. Servers that predate
// streaming answer with plain JSON, which is handled the same way.
export async function requestTryOn(person: string, garment: GarmentRequest, { signal, quality, onPartial }: Options = {}) {
  const res = await fetch("/api/try-on", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ person, garment, quality, stream: true }),
    signal,
  });
  if (!res.ok || !res.headers.get("content-type")?.includes("ndjson") || !res.body) {
    const json = await res.json().catch(() => ({ error: "The server sent an unreadable response." }));
    if (!res.ok || json.error) throw new Error(json.error ?? `Try-on failed (${res.status}).`);
    return json as TryOnResponse;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end: number;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (!line) continue;
      const event = JSON.parse(line);
      if (event.type === "partial") onPartial?.(event.image);
      else if (event.type === "done") return event as TryOnResponse;
      else if (event.type === "error") throw new Error(event.error ?? "Try-on failed.");
    }
  }
  throw new Error("The connection closed before your look was ready. Try again.");
}
