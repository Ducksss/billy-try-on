"use client";

import { useEffect, useId, useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";

type Status = { kind: "idle" | "sending" | "error"; message?: string } | { kind: "done"; added: boolean };

// Waitlist form for the /join landing pages. Also sends one view beacon per visit, the
// denominator of each variant's sign-up rate.
export function WaitlistForm({
  variant,
  cta,
  note,
}: {
  variant: string;
  cta: string;
  note?: { label: string; placeholder: string };
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    const key = `billy:viewed:${variant}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    navigator.sendBeacon?.("/api/waitlist/view", JSON.stringify({ variant }));
  }, [variant]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    // Ads and posts link here with ?utm_source=..., so each sign-up records its channel.
    const params = new URLSearchParams(location.search);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          variant,
          note: noteValue || undefined,
          source: params.get("utm_source") ?? params.get("ref") ?? undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setStatus({ kind: "error", message: json.error ?? "Something went wrong. Try again." });
      setStatus({ kind: "done", added: json.added === true });
    } catch {
      setStatus({ kind: "error", message: "Couldn't reach Billy. Check your connection and try again." });
    }
  }

  if (status.kind === "done") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-[20px] border border-line bg-surface p-5">
        <CheckCircle size={24} weight="fill" className="shrink-0 text-accent" />
        <div>
          <p className="font-semibold">{status.added ? "You're on the list." : "You're already on the list."}</p>
          <p className="mt-1 text-sm text-muted">We&apos;ll email you when there&apos;s something to try. Nothing else.</p>
        </div>
      </div>
    );
  }

  // With an extra field the button goes last, so it isn't pressed before the field is seen.
  const button = (
    <button type="submit" disabled={status.kind === "sending"} className={`btn btn-primary ${note ? "w-full sm:w-auto" : ""}`}>
      {status.kind === "sending" ? "Joining..." : cta}
      <ArrowRight size={16} weight="bold" />
    </button>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={`${id}-email`} className="text-sm font-medium">
          Email
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-[0.9375rem] placeholder:text-muted focus:border-ink focus:outline-none"
          />
          {!note && button}
        </div>
      </div>
      {note && (
        <div className="space-y-1.5">
          <label htmlFor={`${id}-note`} className="text-sm font-medium">
            {note.label} <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={`${id}-note`}
            maxLength={200}
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder={note.placeholder}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[0.9375rem] placeholder:text-muted focus:border-ink focus:outline-none"
          />
        </div>
      )}
      {note && button}
      <p aria-live="polite" className="min-h-5 text-sm text-accent">
        {status.kind === "error" ? status.message : ""}
      </p>
    </form>
  );
}
