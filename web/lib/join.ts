// The three /join landing pages for the USP test: one promise each, same layout, so the
// sign-up rate per page says which promise lands. Edit the words here; the variant ids are
// also stored with each sign-up and in the database's check constraint.
export const VARIANTS = ["looks", "resell", "sellers"] as const;
export type Variant = (typeof VARIANTS)[number];

export function isVariant(value: unknown): value is Variant {
  return VARIANTS.includes(value as Variant);
}

type Status = "Works today" | "Coming soon" | "In the seller pilot";

export type JoinPage = {
  audience: string;
  title: string;
  lede: string;
  cta: string;
  note?: { label: string; placeholder: string };
  before: { src: string; alt: string; caption: string };
  after: { src: string; alt: string; caption: string };
  tag: { text: string; soon: boolean };
  points: { title: string; body: string; status: Status }[];
};

export const joinPages: Record<Variant, JoinPage> = {
  looks: {
    audience: "For secondhand shoppers",
    title: "See it on you. Know it fits.",
    lede: "Secondhand pieces are one of a kind and often can't be returned. Billy shows a listing on you, then checks the seller's measurements against a piece you already own.",
    cta: "Join the waitlist",
    before: { src: "/models/mei.jpg", alt: "Mei's full-length photo", caption: "Your photo" },
    after: { src: "/looks/mei-denim-trucker.jpg", alt: "Mei wearing a pre-loved denim jacket", caption: "On you in about 10 seconds" },
    tag: { text: "Fits like your denim jacket", soon: true },
    points: [
      {
        title: "On any resale listing",
        body: "Drag the listing photo onto your own photo. The first look arrives in about 10 seconds.",
        status: "Works today",
      },
      {
        title: "Fits like yours",
        body: "Save one piece you love with three measurements. Billy compares it with the seller's numbers.",
        status: "Coming soon",
      },
      {
        title: "Decide before you message",
        body: "Save looks, put two side by side, and ask friends whether they'd buy it.",
        status: "Works today",
      },
    ],
  },
  resell: {
    audience: "For secondhand shoppers",
    title: "Buy it, wear it, resell it.",
    lede: "Try a pre-loved piece on before you buy. When you're done with it, Billy turns your looks into a listing that's ready to post, so it finds its next owner.",
    cta: "Join the waitlist",
    before: { src: "/catalogue/denim-trucker.jpg", alt: "Listing photo of a pre-loved denim jacket", caption: "The listing" },
    after: { src: "/looks/mei-denim-trucker.jpg", alt: "Mei wearing the denim jacket", caption: "On you, then ready to resell" },
    tag: { text: "Ready to resell in one tap", soon: true },
    points: [
      {
        title: "Try before you buy",
        body: "See any resale listing on your own photo in about 10 seconds.",
        status: "Works today",
      },
      {
        title: "Resell in one tap",
        body: "Your looks and the item's details carry over into a listing for Carousell, Vinted or Depop.",
        status: "Coming soon",
      },
      {
        title: "Clothes stay in use",
        body: "Built for SDG 12: buy clothes that already exist, and pass them on when you're done.",
        status: "Works today",
      },
    ],
  },
  sellers: {
    audience: "For resale sellers",
    title: "Sell pre-loved faster.",
    lede: "Give buyers a Try it on button. They see your piece on themselves before they message you, so you get fewer \"can you show it worn?\" questions.",
    cta: "Join the seller pilot",
    note: { label: "Where do you sell?", placeholder: "Carousell, Instagram, my own shop..." },
    before: { src: "/catalogue/olive-overshirt.jpg", alt: "Product photo of an olive overshirt", caption: "Your product photo" },
    after: { src: "/looks/arjun-olive-overshirt.jpg", alt: "Arjun wearing the olive overshirt", caption: "What your buyer sees" },
    tag: { text: "Try it on with Billy", soon: false },
    points: [
      {
        title: "A try-on link for every listing",
        body: "Paste it into your listing or bio. Buyers try the piece on in about 10 seconds, with no app to install.",
        status: "In the seller pilot",
      },
      {
        title: "On-model photos from a flat-lay",
        body: "Turn a hanger or flat-lay shot into a photo of the piece being worn.",
        status: "In the seller pilot",
      },
      {
        title: "See who's interested",
        body: "A weekly report of try-ons and would-buy answers for each of your listings.",
        status: "In the seller pilot",
      },
    ],
  },
};
