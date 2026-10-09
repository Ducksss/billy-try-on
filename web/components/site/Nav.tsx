import Link from "next/link";
import { CoatHanger, PuzzlePiece } from "@phosphor-icons/react/dist/ssr";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-[1.35rem] font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-ink">
        <CoatHanger size={18} weight="bold" />
      </span>
      billy
    </Link>
  );
}

const links = [
  { href: "/discover", label: "Pre-loved feed" },
  { href: "/studio", label: "Studio" },
  { href: "/shop", label: "Demo store" },
  { href: "/#sellers", label: "For sellers" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
        <Logo />
        <div className="hidden items-center gap-7 text-[0.9375rem] text-muted md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </div>
        <Link href="/extension" className="btn btn-ink btn-sm">
          <PuzzlePiece size={16} weight="bold" />
          Add to Chrome
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-muted md:grid-cols-[1fr_auto] md:px-8">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-md">
            A prototype for SDG 12, responsible consumption. Garment photos, models and listings on this site are
            AI-generated demo data.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <Link href="/discover" className="hover:text-ink">Pre-loved feed</Link>
          <Link href="/studio" className="hover:text-ink">Studio</Link>
          <Link href="/shop" className="hover:text-ink">Demo store</Link>
          <Link href="/extension" className="hover:text-ink">Chrome extension</Link>
        </div>
      </div>
    </footer>
  );
}
