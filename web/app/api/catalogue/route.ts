import { catalogue } from "@/lib/catalogue";

// Read by the Chrome extension's Discover tab, so image paths are made absolute.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const items = catalogue.map((item) => ({
    ...item,
    image: new URL(item.image, origin).toString(),
    listingUrl: new URL(`/listing/${item.id}`, origin).toString(),
  }));
  return Response.json({ items }, { headers: { "Access-Control-Allow-Origin": "*" } });
}
