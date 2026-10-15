import { createDecartClient } from "@decartai/sdk";
import { MIRROR_MAX_SECONDS, MIRROR_MODEL, mirrorEnabled } from "@/lib/mirror";
import { checkRateLimit } from "@/lib/rate-limit";

// Lets the extension and pages check whether the mirror is switched on without minting a token.
export async function GET() {
  return Response.json(
    { enabled: mirrorEnabled(), maxSeconds: MIRROR_MAX_SECONDS },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } },
  );
}

// Mints a short-lived Decart client token so the browser can open a realtime session
// without ever seeing DECART_API_KEY. The SDK asks for a fresh one on every connect
// and reconnect; a session keeps running after its token expires.
export async function POST(request: Request) {
  if (!mirrorEnabled()) {
    return Response.json({ error: "Live mirror isn't set up on this server." }, { status: 503 });
  }
  // Only /mirror on this site may mint tokens. Browsers always send Origin on a POST, so a
  // missing or foreign one is a script or another site, which would otherwise get a token
  // with no origin restriction and stream on our Decart bill.
  const origin = request.headers.get("origin");
  if (!origin || !sameHost(origin, request.headers.get("host"))) {
    return Response.json({ error: "Start the live mirror from Billy's /mirror page." }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const limit = checkRateLimit(`mirror:${ip}`);
  if (!limit.ok) {
    return Response.json(
      { error: "You've hit this hour's live mirror limit. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const client = createDecartClient({ apiKey: process.env.DECART_API_KEY });
    const token = await client.tokens.create({
      expiresIn: 60,
      allowedModels: [MIRROR_MODEL],
      allowedOrigins: [origin],
      constraints: { realtime: { maxSessionDuration: MIRROR_MAX_SECONDS } },
    });
    return Response.json(
      { apiKey: token.apiKey, expiresAt: token.expiresAt, maxSeconds: MIRROR_MAX_SECONDS },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[mirror] token", err);
    return Response.json({ error: "Couldn't start the live mirror. Try again in a moment." }, { status: 502 });
  }
}

function sameHost(origin: string, host: string | null) {
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}
