import { geminiAspectRatio, imageSize, openAiSize, type ImageInput } from "./image";

export class TryOnError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

// "low" renders in about 10s, "medium" in about 25s. Shoppers pick between the two;
// "high" is only reachable through BILLY_OPENAI_QUALITY.
export type Quality = "low" | "medium" | "high";
export const SHOPPER_QUALITIES = new Set<Quality>(["low", "medium"]);

type ProviderArgs = {
  person: ImageInput;
  garment: ImageInput;
  prompt: string;
  quality?: Quality;
  // Called with rough previews while the final image renders, when the provider can stream.
  onPartial?: (image: ImageInput) => void;
  signal?: AbortSignal;
};
type ProviderResult = { image: ImageInput; model: string };

function upstreamError(status: number, detail: string): TryOnError {
  if (status === 401 || status === 403) return new TryOnError("The try-on service rejected the server's API key.", 500);
  if (status === 402 || /credit|billing|quota/i.test(detail)) {
    return new TryOnError("The try-on service is out of credits. Top up the provider account or switch provider.", 503);
  }
  if (status === 429) return new TryOnError("Too many try-ons at once. Wait a few seconds and try again.", 429);
  if (/safety|moderation|blocked/i.test(detail)) {
    return new TryOnError("The image model declined this photo pair. Try a different photo or garment.", 422);
  }
  return new TryOnError(`Try-on failed upstream (${status}).`, 502);
}

export function defaultQuality(): Quality {
  const q = process.env.BILLY_OPENAI_QUALITY as Quality;
  return ["low", "medium", "high"].includes(q) ? q : "medium";
}

const jpeg = (b64: string): ImageInput => ({ buffer: Buffer.from(b64, "base64"), mimeType: "image/jpeg" });

async function openai({ person, garment, prompt, quality, onPartial, signal }: ProviderArgs): Promise<ProviderResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new TryOnError("OPENAI_API_KEY is not set on the server.", 500);
  const model = process.env.BILLY_OPENAI_MODEL || "gpt-image-2";
  const form = new FormData();
  form.set("model", model);
  form.set("prompt", prompt);
  form.set("size", openAiSize(imageSize(person.buffer)));
  form.set("quality", quality ?? defaultQuality());
  form.set("output_format", "jpeg");
  if (onPartial) {
    form.set("stream", "true");
    form.set("partial_images", "2");
  }
  form.append("image[]", new Blob([new Uint8Array(person.buffer)], { type: person.mimeType }), "person");
  form.append("image[]", new Blob([new Uint8Array(garment.buffer)], { type: garment.mimeType }), "garment");

  const timeout = AbortSignal.timeout(110_000);
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    console.error("[try-on] openai", res.status, json?.error?.message);
    throw upstreamError(res.status, json?.error?.message ?? "");
  }
  if (onPartial && res.headers.get("content-type")?.includes("text/event-stream")) {
    return { image: jpeg(await readOpenAiStream(res, (b64) => onPartial(jpeg(b64)))), model };
  }
  const json = await res.json().catch(() => ({}));
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new TryOnError("The image model returned no image.", 502);
  return { image: jpeg(b64), model };
}

// OpenAI streams server-sent events: `image_edit.partial_image` previews, then
// `image_edit.completed` with the final image. Returns the final image's base64.
async function readOpenAiStream(res: Response, onPartial: (b64: string) => void): Promise<string> {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value.replace(/\r\n/g, "\n");
    let end: number;
    while ((end = buffer.indexOf("\n\n")) >= 0) {
      const data = buffer
        .slice(0, end)
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      buffer = buffer.slice(end + 2);
      if (!data || data === "[DONE]") continue;
      const event = JSON.parse(data);
      if (event.type?.endsWith(".partial_image") && event.b64_json) onPartial(event.b64_json);
      else if (event.type?.endsWith(".completed") && event.b64_json) return event.b64_json;
      else if (event.type === "error" || event.error) {
        const message = event.error?.message ?? event.message ?? "";
        console.error("[try-on] openai stream", message);
        throw upstreamError(502, message);
      }
    }
  }
  throw new TryOnError("The image model returned no image.", 502);
}

async function gemini({ person, garment, prompt, signal }: ProviderArgs): Promise<ProviderResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new TryOnError("GEMINI_API_KEY is not set on the server.", 500);
  const model = process.env.BILLY_GEMINI_MODEL || "gemini-3.1-flash-image";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: person.mimeType, data: person.buffer.toString("base64") } },
            { inline_data: { mime_type: garment.mimeType, data: garment.buffer.toString("base64") } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: geminiAspectRatio(imageSize(person.buffer)) },
      },
    }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(110_000)]) : AbortSignal.timeout(110_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[try-on] gemini", res.status, json?.error?.message);
    throw upstreamError(res.status, json?.error?.message ?? "");
  }
  const parts: Array<{ inlineData?: { mimeType: string; data: string } }> = json?.candidates?.[0]?.content?.parts ?? [];
  const data = parts.find((p) => p.inlineData)?.inlineData;
  if (!data) {
    const reason = json?.candidates?.[0]?.finishReason ?? json?.promptFeedback?.blockReason ?? "";
    throw upstreamError(502, String(reason));
  }
  return { image: { buffer: Buffer.from(data.data, "base64"), mimeType: data.mimeType }, model };
}

export const providers = { openai, gemini };
export type ProviderName = keyof typeof providers;

export function activeProvider(): ProviderName {
  return process.env.BILLY_TRYON_PROVIDER === "gemini" ? "gemini" : "openai";
}
