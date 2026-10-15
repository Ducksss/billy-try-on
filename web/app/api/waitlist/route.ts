import { backendEnabled, joinWaitlist } from "@/lib/backend";
import { isVariant } from "@/lib/join";
import { checkRateLimit } from "@/lib/rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Higher than the try-on limit: a campus booth can put dozens of real sign-ups on one Wi-Fi address.
const SIGNUPS_PER_HOUR = 100;

type Body = { email?: unknown; variant?: unknown; note?: unknown; source?: unknown };

function fail(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

// Sign-ups from the /join landing pages. Answers { added } so the page can tell a new
// sign-up from an email that was already on the list.
export async function POST(request: Request) {
  if (!backendEnabled()) return fail("The waitlist isn't open yet. Try again soon.", 503);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const limit = checkRateLimit(`waitlist:${ip}`, SIGNUPS_PER_HOUR);
  if (!limit.ok) {
    return fail("Too many sign-ups from your network. Try again later.", 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("Send a JSON body with `email` and `variant`.", 400);
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL.test(email)) return fail("Enter a valid email address.", 400);
  if (!isVariant(body.variant)) return fail("Unknown waitlist page.", 400);
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : undefined);

  try {
    const added = await joinWaitlist({
      email,
      variant: body.variant,
      note: text(body.note, 200),
      source: text(body.source, 100),
    });
    return Response.json({ added });
  } catch (err) {
    console.error("[waitlist]", err);
    return fail("Couldn't save your email. Try again in a moment.", 502);
  }
}
