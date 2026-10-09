import { catalogue, type Listing } from "./catalogue";

// ÉTAGE is a fictional store that shows how Billy looks inside a retailer's own site.
// Its products are the Billy catalogue's demo garments, so try-ons use the same
// listing ids, and prices and condition notes stay in one place.
export type ShopSection = "woman" | "man";

export type ShopProduct = {
  id: string;
  name: string;
  section: ShopSection;
  colour: string;
  sizes: string[];
  description: string;
  composition: string;
  model: "mei" | "arjun";
  look: string;
  flat: string;
  listing: Listing;
};

const details: Record<string, Omit<ShopProduct, "id" | "look" | "flat" | "listing">> = {
  "gingham-dress": {
    name: "Gingham midi sundress",
    section: "woman",
    colour: "Red / white",
    sizes: ["XS", "S", "M", "L"],
    description: "Square neckline, thin adjustable straps and a tiered midi skirt in crisp cotton poplin.",
    composition: "100% cotton",
    model: "mei",
  },
  "sage-slip-dress": {
    name: "Floral satin slip dress",
    section: "woman",
    colour: "Sage",
    sizes: ["XS"],
    description: "Bias-cut slip dress with a cowl neck and a small cream floral print. Falls to the ankle.",
    composition: "100% viscose",
    model: "mei",
  },
  "black-blazer": {
    name: "Tailored single-breasted blazer",
    section: "woman",
    colour: "Black",
    sizes: ["M"],
    description: "Notch lapels, a one-button front and flap pockets. Cut close through the waist.",
    composition: "68% polyester, 28% viscose, 4% elastane",
    model: "mei",
  },
  "cable-cardigan": {
    name: "Chunky cable-knit cardigan",
    section: "woman",
    colour: "Ecru",
    sizes: ["S"],
    description: "Heavy cable knit with horn-effect buttons and ribbed cuffs. Wear it open over a dress.",
    composition: "60% wool, 40% acrylic",
    model: "mei",
  },
  "denim-trucker": {
    name: "Washed denim trucker jacket",
    section: "woman",
    colour: "Mid blue",
    sizes: ["M"],
    description: "Classic trucker with chest pockets and a button front, softened by plenty of wear.",
    composition: "100% cotton",
    model: "mei",
  },
  "breton-tee": {
    name: "Striped Breton top",
    section: "woman",
    colour: "Navy / white",
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Boat neck and long sleeves in heavyweight cotton jersey with even navy stripes.",
    composition: "100% cotton",
    model: "mei",
  },
  "windbreaker-90s": {
    name: "Colour-block windbreaker",
    section: "man",
    colour: "Teal / navy / mustard",
    sizes: ["L"],
    description: "Original 1990s nylon shell with a full zip, stand collar and elasticated cuffs.",
    composition: "100% nylon",
    model: "arjun",
  },
  "olive-overshirt": {
    name: "Utility overshirt",
    section: "man",
    colour: "Olive",
    sizes: ["S", "M", "L", "XL"],
    description: "Cotton twill overshirt with two flap chest pockets. Layers over a tee or under a coat.",
    composition: "100% cotton",
    model: "arjun",
  },
  "rust-cord-shirt": {
    name: "Fine-wale corduroy shirt",
    section: "man",
    colour: "Rust",
    sizes: ["L"],
    description: "Soft fine-wale cord with a single chest pocket and a curved hem.",
    composition: "100% cotton",
    model: "arjun",
  },
  "linen-camp-shirt": {
    name: "Linen camp-collar shirt",
    section: "man",
    colour: "White",
    sizes: ["S", "M", "L", "XL"],
    description: "Relaxed short-sleeve shirt with an open camp collar and a straight hem.",
    composition: "100% linen",
    model: "arjun",
  },
  "charcoal-trousers": {
    name: "Pleated wide-leg trousers",
    section: "man",
    colour: "Charcoal",
    sizes: ["28", "30", "32", "34"],
    description: "Double front pleats, a high rise and a wide straight leg in wool-blend suiting.",
    composition: "54% polyester, 44% wool, 2% elastane",
    model: "arjun",
  },
  "grey-sweatshirt": {
    name: "Crewneck sweatshirt",
    section: "man",
    colour: "Heather grey",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Brushed-back fleece with ribbed cuffs, hem and neckline.",
    composition: "80% cotton, 20% polyester",
    model: "arjun",
  },
};

export const shopProducts: ShopProduct[] = catalogue
  .filter((listing) => details[listing.id])
  .map((listing) => {
    const d = details[listing.id];
    return { id: listing.id, ...d, look: `/looks/${d.model}-${listing.id}.jpg`, flat: listing.image, listing };
  });

export const getShopProduct = (id: string) => shopProducts.find((p) => p.id === id);

export const sectionProducts = (section: ShopSection) => shopProducts.filter((p) => p.section === section);

export const shopPrice = (amount: number) => `${amount.toFixed(2)} SGD`;

export function markdown(p: ShopProduct) {
  const { price, originalPrice } = p.listing;
  return originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
}

export const shopLabel = (p: ShopProduct) => (p.listing.kind === "pre-loved" ? "Pre-owned" : "Last season");

// Pieces worth layering over (or under) this one in the try-on drawer.
export function pairings(p: ShopProduct, worn: string[] = []) {
  const wanted: Record<string, string[]> = {
    top: ["outerwear", "bottom"],
    dress: ["outerwear"],
    bottom: ["top", "outerwear"],
    outerwear: ["bottom"],
  };
  return shopProducts.filter(
    (x) =>
      x.section === p.section &&
      x.id !== p.id &&
      !worn.includes(x.id) &&
      wanted[p.listing.category]?.includes(x.listing.category),
  );
}
