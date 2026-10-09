// Renders showcase looks for the landing page and demo shop through the running app's own
// /api/try-on endpoint. Usage: node scripts/generate-looks.mjs [baseUrl]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./image-api.mjs";

const base = process.argv[2] ?? "http://localhost:3000";
const looks = [
  ["mei", "denim-trucker"],
  ["mei", "gingham-dress"],
  ["mei", "cable-cardigan"],
  ["mei", "black-blazer"],
  ["arjun", "windbreaker-90s"],
  ["arjun", "olive-overshirt"],
  ["arjun", "rust-cord-shirt"],
  ["arjun", "linen-camp-shirt"],
  // The demo shop shows every product on a model.
  ["mei", "breton-tee"],
  ["mei", "sage-slip-dress"],
  ["arjun", "charcoal-trousers"],
  ["arjun", "grey-sweatshirt"],
];

await Promise.all(
  looks.map(async ([model, listingId]) => {
    const out = join(ROOT, "web/public/looks", `${model}-${listingId}.jpg`);
    if (existsSync(out) && !process.argv.includes("--force")) return;
    const person = `data:image/jpeg;base64,${readFileSync(join(ROOT, "web/public/models", `${model}.jpg`)).toString("base64")}`;
    const res = await fetch(`${base}/api/try-on`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person, garment: { listingId } }),
    });
    const json = await res.json();
    if (!res.ok) return console.error(`FAIL ${model}-${listingId}: ${res.status} ${json.error}`);
    writeFileSync(out, Buffer.from(json.image.split(",")[1], "base64"));
    console.log(`ok ${model}-${listingId} ${json.provider}/${json.model} ${(json.ms / 1000).toFixed(1)}s`);
  }),
);
