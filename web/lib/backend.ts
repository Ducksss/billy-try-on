import { createClient, type InsForgeClient } from "@insforge/sdk";
import type { Variant } from "@/lib/join";

// InsForge holds the waitlist and the daily counters (migrations/*_create-waitlist.sql).
// Server-only: the anon key is never sent to the browser, and the anon role can only call
// the two database functions used below.
let client: InsForgeClient | null | undefined;

function backend() {
  if (client === undefined) {
    const baseUrl = process.env.INSFORGE_URL;
    const anonKey = process.env.INSFORGE_ANON_KEY;
    client = baseUrl && anonKey ? createClient({ baseUrl, anonKey }) : null;
  }
  return client;
}

export function backendEnabled() {
  return !!backend();
}

// Resolves to true for a new sign-up, false when the email was already on the list.
export async function joinWaitlist(signup: { email: string; variant: Variant; note?: string; source?: string }) {
  const db = backend();
  if (!db) throw new Error("InsForge is not configured");
  const { data, error } = await db.database.rpc("join_waitlist", {
    p_email: signup.email,
    p_variant: signup.variant,
    p_note: signup.note ?? null,
    p_source: signup.source ?? null,
  });
  if (error) throw error;
  return data === true;
}

export async function countView(variant: Variant) {
  const db = backend();
  if (!db) return;
  const { error } = await db.database.rpc("bump_counter", { p_key: `view:${variant}` });
  if (error) console.error("[backend] view", error);
}

// Site-wide daily try-on cap (BILLY_DAILY_TRYON_CAP, counted per UTC day), shared by every
// server instance. Returns false once today's cap is reached. With no cap set, or no
// backend, every try-on is allowed. A backend error also allows the try-on: the per-IP
// limit still applies, and an outage shouldn't take try-ons down with it.
export async function reserveTryOn() {
  const cap = Number(process.env.BILLY_DAILY_TRYON_CAP) || 0;
  const db = backend();
  if (cap <= 0 || !db) return true;
  const { data, error } = await db.database.rpc("bump_counter", { p_key: "tryon", p_cap: cap });
  if (error) {
    console.error("[backend] try-on cap", error);
    return true;
  }
  return data !== null;
}
