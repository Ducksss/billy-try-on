import { countView } from "@/lib/backend";
import { isVariant } from "@/lib/join";
import { checkRateLimit } from "@/lib/rate-limit";

// Landing-page view beacon (navigator.sendBeacon, so the body arrives as text). Views are
// the denominator of the Gate 1 sign-up rate. One address can count at most 30 an hour,
// so a reload loop can't skew one variant; anything over that is accepted but not counted.
export async function POST(request: Request) {
  let variant: unknown;
  try {
    variant = JSON.parse(await request.text()).variant;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!isVariant(variant)) return new Response(null, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (checkRateLimit(`view:${ip}`, 30).ok) await countView(variant);
  return new Response(null, { status: 204 });
}
