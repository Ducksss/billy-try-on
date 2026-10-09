import type { GarmentCategory } from "./tryon/prompt";

// Live mirror: the shopper's camera streams to Decart's realtime try-on model, which
// sends back video of them wearing the garment. Billed per second of streaming
// (about $0.02/s in October 2026), so sessions are capped.
export const MIRROR_MODEL = "lucy-vton-latest";
export const MIRROR_MAX_SECONDS = 120;

export function mirrorEnabled() {
  return !!process.env.DECART_API_KEY;
}

// Decart recommends short "Substitute the current ... with ..." / "Add ..." prompts.
export function mirrorPrompt(category: GarmentCategory, title?: string) {
  const name = title ? `the ${title.toLowerCase().slice(0, 80)}` : "the garment";
  switch (category) {
    case "outerwear":
      return `Add ${name} from the reference image over the person's current outfit, keeping its colour, fabric and details.`;
    case "dress":
      return `Substitute the person's current outfit with ${name} from the reference image, keeping its colour, pattern and length.`;
    case "bottom":
      return `Substitute the person's current bottoms with ${name} from the reference image, keeping its colour, fabric and fit.`;
    case "top":
      return `Substitute the person's current top with ${name} from the reference image, keeping its colour, pattern and fit.`;
    default:
      return `Dress the person in ${name} from the reference image, replacing only the clothing it covers and keeping its colour and pattern.`;
  }
}
