import type { GarmentCategory } from "@/lib/tryon/prompt";

export type GarmentRequest = {
  image?: string;
  url?: string;
  pageUrl?: string;
  title?: string;
  category?: GarmentCategory;
  listingId?: string;
};

export type TryOnResponse = { image: string; provider: string; model: string; ms: number };

export async function requestTryOn(person: string, garment: GarmentRequest, signal?: AbortSignal) {
  const res = await fetch("/api/try-on", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ person, garment }),
    signal,
  });
  const json = await res.json().catch(() => ({ error: "The server sent an unreadable response." }));
  if (!res.ok) throw new Error(json.error ?? `Try-on failed (${res.status}).`);
  return json as TryOnResponse;
}
