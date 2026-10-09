// Minimal OpenAI image helper for the asset scripts. Reads keys from web/.env.local.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnv() {
  const env = {};
  for (const line of readFileSync(join(ROOT, "web/.env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

async function parse(res) {
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${json.error?.message ?? JSON.stringify(json).slice(0, 300)}`);
  return Buffer.from(json.data[0].b64_json, "base64");
}

export async function generateImage({ prompt, size = "768x1024", quality = "medium" }) {
  const env = loadEnv();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: env.BILLY_OPENAI_MODEL ?? "gpt-image-2", prompt, size, quality, output_format: "jpeg" }),
  });
  return parse(res);
}

// images: [{ path, mimeType }]
export async function editImage({ prompt, images, size = "768x1024", quality = "medium" }) {
  const env = loadEnv();
  const form = new FormData();
  form.set("model", env.BILLY_OPENAI_MODEL ?? "gpt-image-2");
  form.set("prompt", prompt);
  form.set("size", size);
  form.set("quality", quality);
  form.set("output_format", "jpeg");
  for (const img of images) {
    form.append("image[]", new Blob([readFileSync(img.path)], { type: img.mimeType }), img.path.split("/").pop());
  }
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });
  return parse(res);
}
