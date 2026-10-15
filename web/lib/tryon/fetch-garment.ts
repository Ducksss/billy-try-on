import { lookup } from "node:dns/promises";
import { TryOnError } from "./providers";
import type { ImageInput } from "./image";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 3;
// Loopback, private, link-local and carrier-grade NAT ranges, plus IPv4-mapped IPv6.
// URL hostnames keep IPv6 literals in brackets; resolved addresses are bracketed to match.
const PRIVATE_HOST =
  /^(localhost|.*\.local|.*\.internal|0\.|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|\[::1?\]|\[::ffff:|\[f[cd][0-9a-f]{2}:|\[fe[89ab][0-9a-f]:)/i;

// Server-side fallback for garment images the browser could not read itself
// (cross-origin images dragged into the web studio). Refuses private hosts, including
// names that resolve to one and redirects that lead to one.
export async function fetchGarmentImage(rawUrl: string, referer?: string): Promise<ImageInput> {
  let url = await publicUrl(rawUrl);
  const signal = AbortSignal.timeout(15_000);
  let res: Response | null = null;
  for (let hop = 0; ; hop++) {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.5",
        ...(referer ? { Referer: referer } : {}),
      },
      // Followed by hand so every hop gets the same private-host check.
      redirect: "manual",
      signal,
    }).catch(() => null);
    const location = res?.headers.get("location");
    if (!res || res.status < 300 || res.status >= 400 || !location) break;
    if (hop === MAX_REDIRECTS) throw new TryOnError("That garment link redirects too many times.", 422);
    url = await publicUrl(new URL(location, url).toString());
  }
  if (!res?.ok) throw new TryOnError("Couldn't download that garment image. Try saving it and uploading it instead.", 422);

  const mimeType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    throw new TryOnError("That link isn't a JPEG, PNG or WebP image.", 415);
  }
  if (Number(res.headers.get("content-length")) > MAX_BYTES) throw tooLarge();
  return { buffer: await readCapped(res), mimeType };
}

async function publicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new TryOnError("That garment link is not a valid URL.", 400);
  }
  const refused = () => new TryOnError("That garment link can't be fetched.", 400);
  if (!/^https?:$/.test(url.protocol) || PRIVATE_HOST.test(url.hostname)) throw refused();
  // A public-looking name can still point inside. This doesn't stop a name that changes
  // its answer between this lookup and the fetch, but it does stop the static ones.
  const addresses = await lookup(url.hostname, { all: true }).catch(() => []);
  if (addresses.some((a) => PRIVATE_HOST.test(a.family === 6 ? `[${a.address}]` : a.address))) throw refused();
  return url;
}

// Stops reading as soon as the body passes the limit, so a huge response can't fill memory.
async function readCapped(res: Response): Promise<Buffer> {
  const reader = res.body!.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) {
      reader.cancel().catch(() => {});
      throw tooLarge();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

const tooLarge = () => new TryOnError("That garment image is larger than 8 MB.", 413);
