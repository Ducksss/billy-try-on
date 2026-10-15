import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { WaitlistForm } from "@/components/join/WaitlistForm";
import { Footer, Logo } from "@/components/site/Nav";
import { isVariant, joinPages, VARIANTS, type JoinPage } from "@/lib/join";

export function generateStaticParams() {
  return VARIANTS.map((variant) => ({ variant }));
}

// Visitors arrive from ads and posts, never from an in-app link, so there's no client
// navigation into these pages to keep instant.
export const instant = false;

// Test pages for ads and posts: kept out of search so organic traffic doesn't skew the split.
export async function generateMetadata({ params }: PageProps<"/join/[variant]">): Promise<Metadata> {
  const { variant } = await params;
  return {
    title: isVariant(variant) ? joinPages[variant].title : "Join",
    robots: { index: false },
  };
}

export default async function JoinPage({ params }: PageProps<"/join/[variant]">) {
  const { variant } = await params;
  if (!isVariant(variant)) notFound();
  const page = joinPages[variant];

  return (
    <>
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 md:px-8">
          <Logo />
        </div>
      </header>
      <main className="flex-1">
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 md:px-8 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16 lg:pb-20 lg:pt-16">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-accent">{page.audience}</p>
            <h1 className="mt-3 text-[2.75rem] font-semibold leading-[1.02] tracking-tighter md:text-[3.5rem]">
              {page.title}
            </h1>
            <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-muted">{page.lede}</p>
            <div className="mt-8 max-w-lg">
              <WaitlistForm variant={variant} cta={page.cta} note={page.note} />
            </div>
          </div>
          <BeforeAfter page={page} />
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
            <ol className="grid gap-10 md:grid-cols-3 md:gap-12">
              {page.points.map((point, i) => (
                <li key={point.title}>
                  <span className="text-sm tabular-nums text-muted">0{i + 1}</span>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">{point.title}</h2>
                  <p className="mt-2 max-w-[38ch] leading-relaxed text-muted">{point.body}</p>
                  <span
                    className={`mt-4 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                      point.status === "Works today" ? "bg-ink text-bg" : "border border-line text-muted"
                    }`}
                  >
                    {point.status}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-14 max-w-[72ch] text-sm leading-relaxed text-muted">
              Billy is early. Anything marked Coming soon isn&apos;t built yet, and sign-ups tell us what to build
              first. We keep your email and the page you joined from, use them only to write to you about Billy, and
              delete them if you reply and ask.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function BeforeAfter({ page }: { page: JoinPage }) {
  return (
    <div className="relative grid grid-cols-2 gap-3">
      {[page.before, page.after].map((shot, i) => (
        <figure key={shot.src}>
          <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] border border-line bg-surface-2">
            <Image
              src={shot.src}
              alt={shot.alt}
              fill
              priority
              sizes="(min-width: 1024px) 15rem, 45vw"
              className="object-cover"
            />
            {i === 1 && (
              <span className="absolute inset-x-3 bottom-3 rounded-2xl bg-surface/90 px-3 py-2 text-center text-[0.8125rem] font-medium leading-snug shadow-lift backdrop-blur">
                {page.tag.text}
                {page.tag.soon && <span className="block text-xs font-normal text-muted">Coming soon</span>}
              </span>
            )}
          </div>
          <figcaption className="mt-2 text-sm text-muted">{shot.caption}</figcaption>
        </figure>
      ))}
      <span
        aria-hidden
        className="absolute left-1/2 top-[44%] grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-accent-ink shadow-lift"
      >
        <ArrowRight size={18} weight="bold" />
      </span>
    </div>
  );
}
