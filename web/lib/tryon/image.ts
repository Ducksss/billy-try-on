export type ImageInput = { buffer: Buffer; mimeType: string };

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export function parseDataUrl(value: unknown, maxBytes: number): ImageInput | null {
  if (typeof value !== "string") return null;
  const m = value.match(DATA_URL);
  if (!m) return null;
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length === 0 || buffer.length > maxBytes) return null;
  return { buffer, mimeType: m[1] };
}

export function toDataUrl(img: ImageInput) {
  return `data:${img.mimeType};base64,${img.buffer.toString("base64")}`;
}

// Reads pixel dimensions from JPEG, PNG or WebP headers without decoding the image.
export function imageSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      // SOF0-SOF15, excluding DHT (C4), JPG (C8) and DAC (CC).
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

// gpt-image-2 accepts any WxH with both sides divisible by 16, ratio within 1:3..3:1
// and at least ~0.65MP. Aim for ~0.8MP so try-ons stay quick.
export function openAiSize(size: { width: number; height: number } | null) {
  if (!size) return "768x1024";
  const ratio = Math.min(3, Math.max(1 / 3, size.width / size.height));
  const pixels = 800_000;
  const w = Math.round(Math.sqrt(pixels * ratio) / 16) * 16;
  const h = Math.round(Math.sqrt(pixels / ratio) / 16) * 16;
  return `${w}x${h}`;
}

const GEMINI_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];

export function geminiAspectRatio(size: { width: number; height: number } | null) {
  if (!size) return "3:4";
  const target = size.width / size.height;
  return GEMINI_RATIOS.reduce((best, r) => {
    const [a, b] = r.split(":").map(Number);
    const [ba, bb] = best.split(":").map(Number);
    return Math.abs(Math.log(a / b / target)) < Math.abs(Math.log(ba / bb / target)) ? r : best;
  });
}
