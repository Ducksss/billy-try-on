// Generates the demo catalogue garments and the AI example models into web/public.
// Usage: node scripts/generate-assets.mjs [--only id1,id2] [--force]
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { ROOT, generateImage } from "./image-api.mjs";

const BACKDROP = "a seamless light warm-grey studio backdrop (#E9E8E4)";

const garments = [
  ["denim-trucker", "a washed mid-blue denim trucker jacket with copper buttons, lightly faded at the seams, pre-loved"],
  ["cable-cardigan", "a chunky cream cable-knit wool cardigan with tortoiseshell buttons, pre-loved"],
  ["olive-overshirt", "an olive green cotton utility overshirt with two chest flap pockets, brand new"],
  ["breton-tee", "a navy and white striped Breton long-sleeve cotton top with a boat neck, brand new"],
  ["sage-slip-dress", "a sage green satin midi slip dress with a small cream floral print and thin straps, pre-loved"],
  ["black-blazer", "a black single-breasted tailored wool-blend blazer with notch lapels, pre-loved"],
  ["rust-cord-shirt", "a rust orange fine-wale corduroy button-up shirt, pre-loved vintage"],
  ["linen-camp-shirt", "a white linen short-sleeve camp-collar shirt, brand new"],
  ["windbreaker-90s", "a 1990s colour-block nylon windbreaker jacket in teal, navy and mustard, pre-loved vintage"],
  ["charcoal-trousers", "charcoal grey pleated wide-leg wool trousers, brand new"],
  ["grey-sweatshirt", "a heather grey cotton crewneck sweatshirt with ribbed cuffs, brand new"],
  ["gingham-dress", "a red and white gingham cotton sundress with a square neckline and a midi-length skirt, brand new"],
];

const models = [
  ["mei", "a Singaporean Chinese woman in her mid twenties with shoulder-length black hair"],
  ["arjun", "a Singaporean Indian man in his late twenties with short wavy black hair"],
];

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(",")) : null;

const jobs = [];
for (const [id, desc] of garments) {
  jobs.push({
    id,
    out: join(ROOT, "web/public/catalogue", `${id}.jpg`),
    prompt:
      `Professional e-commerce product photo of ${desc}. Shown on an invisible ghost mannequin, front view, ` +
      `whole garment visible and centred with generous margin, on ${BACKDROP}. Soft even studio lighting, ` +
      `true-to-life colour and fabric texture. No person, no hanger, no text, no logos, no labels, no props.`,
  });
}
for (const [id, desc] of models) {
  jobs.push({
    id,
    out: join(ROOT, "web/public/models", `${id}.jpg`),
    prompt:
      `Photorealistic full-length fashion catalogue photo of ${desc}, standing straight facing the camera with arms ` +
      `relaxed at the sides, head to shoes in frame. Wearing a plain fitted white crew-neck t-shirt, straight-leg ` +
      `light blue jeans and white sneakers. Neutral friendly expression. On ${BACKDROP}, soft even studio light, ` +
      `shot on a 50mm lens. No text, no logos.`,
  });
}

const todo = jobs.filter((j) => (!only || only.has(j.id)) && (force || !existsSync(j.out)));
console.log(`Generating ${todo.length} image(s)`);

async function run(job) {
  mkdirSync(join(job.out, ".."), { recursive: true });
  const started = Date.now();
  const buf = await generateImage({ prompt: job.prompt, size: "768x1024" });
  const tmp = `${job.out}.src`;
  writeFileSync(tmp, buf);
  // Normalise to a 900px-tall JPEG so the repo stays small.
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", "--resampleHeight", "900", tmp, "--out", job.out], { stdio: "ignore" });
  execFileSync("rm", [tmp]);
  console.log(`  ok ${job.id} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
}

const queue = [...todo];
const failures = [];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        await run(job);
      } catch (err) {
        failures.push(job.id);
        console.error(`  FAIL ${job.id}: ${err.message}`);
      }
    }
  }),
);
if (failures.length) {
  console.error(`Failed: ${failures.join(", ")}`);
  process.exit(1);
}
