import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getListing } from "@/lib/catalogue";
import { checkRateLimit } from "@/lib/rate-limit";
import { fetchGarmentImage } from "@/lib/tryon/fetch-garment";
import { parseDataUrl, toDataUrl, type ImageInput } from "@/lib/tryon/image";
import { buildTryOnPrompt, type GarmentCategory } from "@/lib/tryon/prompt";
import { activeProvider, providers, SHOPPER_QUALITIES, TryOnError, type Quality } from "@/lib/tryon/providers";

export const maxDuration = 120;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const CATEGORIES = new Set<GarmentCategory>(["top", "outerwear", "dress", "bottom", "auto"]);

type Body = {
  person?: unknown;
  quality?: unknown;
  // Ask for newline-delimited JSON: `partial` previews while rendering, then `done` or `error`.
  stream?: unknown;
  garment?: {
    image?: unknown;
    url?: unknown;
    pageUrl?: unknown;
    title?: unknown;
    category?: unknown;
    listingId?: unknown;
  };
};

function fail(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return fail("You've hit this hour's try-on limit. Try again later.", 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("Send a JSON body with `person` and `garment`.", 400);
  }

  const person = parseDataUrl(body.person, MAX_IMAGE_BYTES);
  if (!person) return fail("Add a JPEG, PNG or WebP photo of yourself (under 8 MB).", 400);

  const g = body.garment ?? {};
  const listing = typeof g.listingId === "string" ? getListing(g.listingId) : undefined;
  const title = listing?.title ?? (typeof g.title === "string" ? g.title : undefined);
  const category: GarmentCategory =
    listing?.category ?? (CATEGORIES.has(g.category as GarmentCategory) ? (g.category as GarmentCategory) : "auto");

  const quality = SHOPPER_QUALITIES.has(body.quality as Quality) ? (body.quality as Quality) : undefined;
  const started = Date.now();
  let garment: ImageInput | null;
  try {
    garment = parseDataUrl(g.image, MAX_IMAGE_BYTES);
    if (!garment && listing) garment = await readCatalogueImage(listing.image);
    if (!garment && typeof g.url === "string") {
      garment = await fetchGarmentImage(g.url, typeof g.pageUrl === "string" ? g.pageUrl : undefined);
    }
  } catch (err) {
    return errorResponse(err);
  }
  if (!garment) return fail("Add a garment image, link or catalogue item.", 400);

  const provider = activeProvider();
  const args = { person, garment, prompt: buildTryOnPrompt(category, title), quality };
  const finished = (result: { image: ImageInput; model: string }) => ({
    image: toDataUrl(result.image),
    provider,
    model: result.model,
    ms: Date.now() - started,
  });

  if (body.stream !== true) {
    try {
      return Response.json(finished(await providers[provider]({ ...args, signal: request.signal })));
    } catch (err) {
      return errorResponse(err);
    }
  }

  // Cancelling the request (the shopper pressed Cancel) also cancels the upstream call.
  const upstream = new AbortController();
  request.signal.addEventListener("abort", () => upstream.abort());
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) => {
        if (!upstream.signal.aborted) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        const result = await providers[provider]({
          ...args,
          signal: upstream.signal,
          onPartial: (image) => send({ type: "partial", image: toDataUrl(image) }),
        });
        send({ type: "done", ...finished(result) });
      } catch (err) {
        if (!upstream.signal.aborted) {
          const { error, status } = describeError(err);
          send({ type: "error", error, status });
        }
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      upstream.abort();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform" },
  });
}

function describeError(err: unknown) {
  if (err instanceof TryOnError) return { error: err.message, status: err.status };
  console.error("[try-on] unexpected", err);
  return { error: "Something went wrong generating your look.", status: 500 };
}

function errorResponse(err: unknown) {
  const { error, status } = describeError(err);
  return fail(error, status);
}

// Read from disk rather than fetching our own URL, which Vercel's deployment
// protection can block. next.config.ts traces public/catalogue into this function.
async function readCatalogueImage(path: string): Promise<ImageInput> {
  try {
    return { buffer: await readFile(join(process.cwd(), "public", path)), mimeType: "image/jpeg" };
  } catch {
    throw new TryOnError("Catalogue image is missing.", 500);
  }
}
