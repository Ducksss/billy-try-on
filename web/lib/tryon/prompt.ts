export type GarmentCategory = "top" | "outerwear" | "dress" | "bottom" | "auto";

const CATEGORY_RULES: Record<GarmentCategory, string> = {
  top: "The garment is a top. Replace the shopper's top with it and keep their bottoms and shoes.",
  outerwear:
    "The garment is a layering piece (jacket, coat, cardigan or overshirt). Put it on over what the shopper is wearing, styled the way the product photo shows it.",
  dress: "The garment is a dress. Replace both the shopper's top and bottoms with it and keep their shoes.",
  bottom: "The garment is a bottom (trousers, skirt or shorts). Replace the shopper's bottoms with it and keep their top and shoes.",
  auto: "Work out what kind of garment it is and replace only the clothing it would cover. Layer jackets and cardigans over what the shopper is wearing.",
};

export function buildTryOnPrompt(category: GarmentCategory = "auto", title?: string) {
  const named = title ? ` The product is listed as "${title.slice(0, 120)}".` : "";
  return [
    "Virtual try-on. Image 1 is the shopper. Image 2 is a clothing product photo." + named,
    "Create a photorealistic photo of the exact same person from image 1 wearing the garment from image 2.",
    "Keep from image 1, unchanged: face and identity, skin tone, hair, body shape and proportions, pose, camera framing, background and lighting.",
    "Copy from image 2 faithfully: the garment's colour, pattern, fabric texture, buttons, pockets, collar, length and fit.",
    CATEGORY_RULES[category],
    "If image 2 shows a model or mannequin, take only the garment from it. Output a single natural photo with no text, borders or collage.",
  ].join("\n");
}
