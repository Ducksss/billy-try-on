import type { Metadata } from "next";
import Link from "next/link";
import { Archivo_Narrow, Bodoni_Moda } from "next/font/google";
import { ShopHeader } from "@/components/shop/ShopChrome";
import { ShopProvider } from "@/components/shop/ShopProvider";

const bodoni = Bodoni_Moda({ subsets: ["latin"], variable: "--font-bodoni", style: ["normal", "italic"] });
const archivoNarrow = Archivo_Narrow({ subsets: ["latin"], variable: "--font-archivo-narrow", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "ÉTAGE demo store", template: "%s · ÉTAGE demo store" },
  description: "A fictional fashion store showing how Billy's virtual try-on works inside a retailer's own site.",
};

export default function ShopLayout({ children }: LayoutProps<"/shop">) {
  return (
    <div className={`shop-root ${bodoni.variable} ${archivoNarrow.variable} flex flex-1 flex-col font-narrow`}>
      <ShopProvider>
        <div className="relative z-30 flex h-8 items-center justify-between gap-4 bg-ink px-3 font-sans text-[11px] text-white md:px-6">
          <p className="flex min-w-0 items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-accent" />
            <span className="truncate">Demo store. The products and models are AI-generated, and the try-on is Billy.</span>
          </p>
          <Link href="/" className="shrink-0 underline-offset-2 hover:underline">
            About Billy
          </Link>
        </div>
        <ShopHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line px-3 py-10 md:px-6">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-display text-3xl font-medium tracking-[0.08em]">ÉTAGE</p>
              <p className="mt-3 max-w-md font-sans text-[13px] leading-relaxed text-muted">
                ÉTAGE is a fictional store made to show how Billy&apos;s virtual try-on works inside a retailer&apos;s own
                site. Its products, prices and models are AI-generated demo data.
              </p>
            </div>
            <nav className="shop-caps flex flex-wrap gap-x-6 gap-y-2 text-[12px]" aria-label="Billy">
              <Link href="/" className="underline-offset-4 hover:underline">
                Billy
              </Link>
              <Link href="/studio" className="underline-offset-4 hover:underline">
                Billy studio
              </Link>
              <Link href="/extension" className="underline-offset-4 hover:underline">
                Billy for Chrome
              </Link>
            </nav>
          </div>
        </footer>
      </ShopProvider>
    </div>
  );
}
