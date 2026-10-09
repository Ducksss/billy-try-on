import { TryOnError } from "./providers";
import type { ImageInput } from "./image";

const MAX_BYTES = 8 * 1024 * 1024;
const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|\[?f[cd][0-9a-f]{2}:)/i;

// Server-side fallback for garment images the browser could not read itself
// (cross-origin images dragged into the web studio). Refuses private hosts.
export async function fetchGarmentImage(rawUrl: string, referer?: string): Promise<ImageInput> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new TryOnError("That garment link is not a valid URL.", 400);
  }
  if (!/^https?:$/.test(url.protocol) || PRIVATE_HOST.test(url.hostname)) {
    throw new TryOnError("That garment link can't be fetched.", 400);
  }
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.5",
      ...(referer ? { Referer: referer } : {}),
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!res?.ok) throw new TryOnError("Couldn't download that garment image. Try saving it and uploading it instead.", 422);

  const mimeType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    throw new TryOnError("That link isn't a JPEG, PNG or WebP image.", 415);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_BYTES) throw new TryOnError("That garment image is larger than 8 MB.", 413);
  return { buffer, mimeType };
}
