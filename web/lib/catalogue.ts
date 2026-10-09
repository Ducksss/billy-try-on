import type { GarmentCategory } from "./tryon/prompt";

// Demo listings for the hackathon prototype. Garment photos are AI-generated and the
// sellers are fictional. In production these rows come from partner resale sellers
// and retailers' surplus feeds, and `View listing` deep-links to the seller's own page.
export type Listing = {
  id: string;
  title: string;
  kind: "pre-loved" | "surplus";
  category: Exclude<GarmentCategory, "auto">;
  image: string;
  price: number;
  originalPrice?: number;
  size: string;
  condition: string;
  seller: string;
  note: string;
};

export const catalogue: Listing[] = [
  {
    id: "denim-trucker",
    title: "Washed denim trucker jacket",
    kind: "pre-loved",
    category: "outerwear",
    image: "/catalogue/denim-trucker.jpg",
    price: 38,
    size: "M",
    condition: "Gently used",
    seller: "Kopi & Thread",
    note: "Worn a handful of times. The fading along the seams came that way.",
  },
  {
    id: "windbreaker-90s",
    title: "90s colour-block windbreaker",
    kind: "pre-loved",
    category: "outerwear",
    image: "/catalogue/windbreaker-90s.jpg",
    price: 42,
    size: "L",
    condition: "Vintage, good",
    seller: "Mended Vintage",
    note: "Original 1990s nylon shell. Zip runs smoothly, no tears.",
  },
  {
    id: "olive-overshirt",
    title: "Olive utility overshirt",
    kind: "surplus",
    category: "outerwear",
    image: "/catalogue/olive-overshirt.jpg",
    price: 29,
    originalPrice: 69,
    size: "S to XL",
    condition: "New with tags",
    seller: "Northbound Supply",
    note: "Last season's overstock from a local label. Never worn.",
  },
  {
    id: "gingham-dress",
    title: "Red gingham sundress",
    kind: "surplus",
    category: "dress",
    image: "/catalogue/gingham-dress.jpg",
    price: 28,
    originalPrice: 75,
    size: "XS to L",
    condition: "New with tags",
    seller: "Northbound Supply",
    note: "Cotton poplin, midi length. Surplus from a cancelled wholesale order.",
  },
  {
    id: "cable-cardigan",
    title: "Chunky cable-knit cardigan",
    kind: "pre-loved",
    category: "outerwear",
    image: "/catalogue/cable-cardigan.jpg",
    price: 32,
    size: "S",
    condition: "Excellent",
    seller: "Second Rack",
    note: "Wool blend, no pilling. Bought for a winter trip and barely worn since.",
  },
  {
    id: "breton-tee",
    title: "Striped Breton top",
    kind: "surplus",
    category: "top",
    image: "/catalogue/breton-tee.jpg",
    price: 18,
    originalPrice: 45,
    size: "XS to XL",
    condition: "New with tags",
    seller: "Harbour Basics",
    note: "Heavyweight cotton jersey. Overstock in every size.",
  },
  {
    id: "black-blazer",
    title: "Black tailored blazer",
    kind: "pre-loved",
    category: "outerwear",
    image: "/catalogue/black-blazer.jpg",
    price: 45,
    size: "M",
    condition: "Gently used",
    seller: "Second Rack",
    note: "Worn to two interviews. Dry-cleaned before listing.",
  },
  {
    id: "sage-slip-dress",
    title: "Sage floral slip dress",
    kind: "pre-loved",
    category: "dress",
    image: "/catalogue/sage-slip-dress.jpg",
    price: 26,
    size: "XS",
    condition: "Excellent",
    seller: "Kopi & Thread",
    note: "Satin finish with a small cream floral print. Worn once to a wedding.",
  },
  {
    id: "rust-cord-shirt",
    title: "Rust corduroy shirt",
    kind: "pre-loved",
    category: "top",
    image: "/catalogue/rust-cord-shirt.jpg",
    price: 24,
    size: "L",
    condition: "Vintage, good",
    seller: "Mended Vintage",
    note: "Fine-wale cord, soft from years of washing. One replaced button.",
  },
  {
    id: "linen-camp-shirt",
    title: "White linen camp-collar shirt",
    kind: "surplus",
    category: "top",
    image: "/catalogue/linen-camp-shirt.jpg",
    price: 22,
    originalPrice: 59,
    size: "S to XL",
    condition: "New with tags",
    seller: "Harbour Basics",
    note: "Pure linen. Surplus from a store closing down.",
  },
  {
    id: "charcoal-trousers",
    title: "Pleated wide-leg trousers",
    kind: "surplus",
    category: "bottom",
    image: "/catalogue/charcoal-trousers.jpg",
    price: 34,
    originalPrice: 89,
    size: "24 to 32",
    condition: "New with tags",
    seller: "Northbound Supply",
    note: "Wool-blend suiting. Overstock from the autumn range.",
  },
  {
    id: "grey-sweatshirt",
    title: "Heather grey crewneck",
    kind: "surplus",
    category: "top",
    image: "/catalogue/grey-sweatshirt.jpg",
    price: 19,
    originalPrice: 49,
    size: "S to XXL",
    condition: "New with tags",
    seller: "Harbour Basics",
    note: "Brushed-back cotton fleece. Excess stock from a uniform order.",
  },
];

export function getListing(id: string) {
  return catalogue.find((item) => item.id === id);
}

export function formatPrice(value: number) {
  return `S$${value}`;
}
