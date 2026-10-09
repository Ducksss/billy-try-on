import type { Metadata } from "next";
import Image from "next/image";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { Footer, Nav } from "@/components/site/Nav";

export const metadata: Metadata = { title: "Add Billy to Chrome" };

const steps = [
  { title: "Download the extension", body: "Get the zip below and unzip it somewhere you'll keep it, such as your Documents folder." },
  { title: "Open Chrome's extensions page", body: "Type chrome://extensions into the address bar and switch on Developer mode in the top-right corner." },
  { title: "Load the folder", body: "Press Load unpacked and choose the unzipped billy-extension folder. Pin Billy from the puzzle-piece menu." },
  { title: "Add your photo", body: "Click Billy in the toolbar to open the side panel, then upload a full-length photo or borrow an example model." },
];

export default function ExtensionPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-12 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Add Billy to Chrome</h1>
            <p className="mt-4 max-w-[46ch] text-muted">
              Billy isn&apos;t on the Chrome Web Store yet, so it installs as an unpacked extension. It takes about a
              minute.
            </p>
            <a href="/billy-extension.zip" download className="btn btn-primary mt-8">
              <DownloadSimple size={16} weight="bold" />
              Download extension
            </a>
            <ol className="mt-12 space-y-8">
              {steps.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-3">
                  <span className="grid size-8 place-items-center rounded-full border border-line text-sm font-medium tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <h2 className="font-semibold">{step.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-10 rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-muted">
              This download runs try-ons on <code className="font-mono text-[0.8125rem] text-ink">billy-try-on.vercel.app</code>.
              To use your own server instead, change the address from the gear icon in Billy&apos;s side panel.
            </p>
          </div>

          <div className="space-y-10">
            <figure>
              <div className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-lift">
                <Image src="/extension/hover-pill.jpg" alt="A Try on button over a product photo on a shop page" width={1280} height={860} className="h-auto w-full" />
              </div>
              <figcaption className="mt-3 text-sm text-muted">Hover any product photo on any shop and press Try on.</figcaption>
            </figure>
            <figure>
              <div className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-lift">
                <Image src="/extension/result.jpg" alt="Billy's result card showing the shirt on the shopper" width={1280} height={860} className="h-auto w-full" />
              </div>
              <figcaption className="mt-3 text-sm text-muted">
                The look appears on the same page in about 25 seconds. Hold to compare, save it, or keep shopping.
              </figcaption>
            </figure>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
