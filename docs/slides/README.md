# Billy product pitch and demo

A ten-slide pitch for the current Billy prototype, prepared on 10 October 2026. Allow about five minutes, plus time for a live try-on.

- [Editable PowerPoint](billy-pitch.pptx)
- [PDF for presenting or sharing](billy-pitch.pdf)

The PowerPoint contains editable text, embedded images, speaker notes and working demo links. Edit the deck in PowerPoint or another compatible presentation editor and export a fresh PDF after changing it so both copies stay in sync.

The deck uses Billy’s off-white, charcoal and terracotta colours, with Arial for portability. All models, garments and try-on previews are AI-generated demo assets. The extension screenshot uses the repository’s test fixture. The ÉTAGE product-page screenshot shows the live fictional store. The Studio screenshot uses existing generated looks and example verdicts, which do not represent shopper research. Sellers, prices and catalogue listings are fictional.

The SDG 12 connection is an impact hypothesis. The deck does not claim measured adoption, revenue, avoided returns, waste reduction or emissions savings. The proposed pilot is future work.

## Live demo

1. Open the [Studio](https://billy-try-on.vercel.app/studio). Add your own full-length photo or choose an AI-generated example model.
2. Select a garment from the demo feed and generate the look. A live generation sends the photo and garment to the image provider and can incur API costs.
3. Save the result and choose a purchase verdict. Generate and save a second look, select both in Saved looks, then open Compare 2 looks.
4. Use Keep it on to build another layer on the current outfit, or share a finished look through the share control.
5. Open the [ÉTAGE demo store](https://billy-try-on.vercel.app/shop) and select Try it on from a product page to show the retailer flow. Its bag works locally and checkout is disabled.
6. Show the [Chrome extension](https://billy-try-on.vercel.app/extension) or slide 4 to explain trying on an image while browsing another shop.

Quick is the default rendering option, while Detailed requests a higher quality. Streamed previews depend on what the image provider returns. Allow for provider latency, rate limits and possible generation errors. Use the saved preview on slide 3 and the demo captures on slides 4 to 6 if the live request fails. Appearance previews do not verify measurements, sizing or garment condition.

The [live mirror](https://billy-try-on.vercel.app/mirror) is implemented but off on the current deployment. The root README records that it has not run against a real Decart session. Set up the provider and test a real session before including it in a live demo.

## Presenter notes and sources

### 1. Billy

On the slide:

- billy
- Virtual try-on for pre-loved clothing
- Product pitch and demo
- SDG 12 prototype

Billy is a working virtual try-on prototype for pre-loved and surplus clothing, built for SDG 12, Challenge Statement 2. The shopper brings one photo and Billy generates a visual preview from a garment photo. Introduce the product, then move straight into the shopping problem. The model and result on this slide are AI-generated demo assets.

Sources and assets:

- [README.md](../../README.md)
- [web/app/page.tsx](../../web/app/page.tsx)
- [web/public/looks/mei-black-blazer.jpg](../../web/public/looks/mei-black-blazer.jpg)

### 2. Choosing from a listing

On the slide:

- Choosing from a listing
- A product photo shows the garment. The shopper still has to imagine it on themselves.
- Billy starts with pre-loved pieces and retailers’ unsold stock.
- AI-generated demo garment

The product hypothesis is that a visual preview can help a shopper decide whether a garment suits them. A listing photo shows the item, while the shopper still has to imagine it on their own body. Billy focuses its demo feed on second-hand pieces and unsold retailer stock. This is a problem framing, not a measured claim about buyer behaviour. The garment shown is an AI-generated demo listing.

Sources and assets:

- [README.md](../../README.md)
- [web/lib/catalogue.ts](../../web/lib/catalogue.ts)
- [web/public/catalogue/denim-trucker.jpg](../../web/public/catalogue/denim-trucker.jpg)

### 3. Two photos, one preview

On the slide:

- Two photos, one preview
- Add a photo, choose a garment, then generate a look.
- 01  Your photo
- 02  A garment
- 03  The preview
- AI-generated demo. Sizing still needs measurements.

Walk through the complete core flow. First, add a full-length photo. Second, choose a garment from a listing, the demo feed or an upload. Third, generate the preview. The example uses Arjun and the 90s colour-block windbreaker. The original, garment and result are AI-generated assets already used by the product. The preview represents appearance and does not verify sizing or physical fit. The shopper should confirm measurements and condition with the seller.

Sources and assets:

- [web/app/page.tsx](../../web/app/page.tsx)
- [web/components/studio/Studio.tsx](../../web/components/studio/Studio.tsx)
- [web/public/models/arjun.jpg](../../web/public/models/arjun.jpg)
- [web/public/catalogue/windbreaker-90s.jpg](../../web/public/catalogue/windbreaker-90s.jpg)
- [web/public/looks/arjun-windbreaker-90s.jpg](../../web/public/looks/arjun-windbreaker-90s.jpg)

### 4. Try-on while you browse

On the slide:

- Try-on while you browse
- Hover a photo or drag it in
- The preview appears on the shop page
- Save a look and keep browsing
- Demo shop capture

The Chrome extension adds a Try on control to product photos. A shopper can also drag a garment onto the in-page target or into the side panel. Billy shows the result on the shop page, with options to compare to the original and save the look. This screenshot comes from the repository’s extension test fixture, a mock resale shop. The store, seller and price are demo content. A successful capture demonstrates the implemented UI, not compatibility with every retail site. Chrome host permissions and website restrictions can affect availability.

Sources and assets:

- [extension/content.js](../../extension/content.js)
- [extension/background.js](../../extension/background.js)
- [tests/screenshots/ext-7-result.png](../../tests/screenshots/ext-7-result.png)
- [tests/fixtures/shop.html](../../tests/fixtures/shop.html)

### 5. Try-on inside a shop

On the slide:

- Try-on inside a shop
- ÉTAGE is Billy’s fictional retailer demo.
- A Billy button on the product page
- Preview the garment, then add it to the shop’s own bag
- Fictional stock. Checkout is disabled.

ÉTAGE is a fictional retailer demo that shows Billy embedded in a shop. The orange Try it on button opens Billy’s drawer. The drawer asks for the shopper’s photo once, generates a preview and hands Add to bag back to the store. Wear it with can layer a matching piece over the current look. Once a shopper tries an item, the product card and gallery can show their own preview. The bag works locally, but checkout is disabled. This is an integration demonstration, not a live retailer partnership or a commerce launch. The screenshot shows the live demo product page on 10 October 2026, with AI-generated model and garment imagery.

Sources and assets:

- [README.md](../../README.md) (Demo store)
- [web/components/shop/TryOnDrawer.tsx](../../web/components/shop/TryOnDrawer.tsx)
- [web/components/shop/ShopProvider.tsx](../../web/components/shop/ShopProvider.tsx)
- [web/components/shop/ProductGallery.tsx](../../web/components/shop/ProductGallery.tsx)
- [https://billy-try-on.vercel.app/shop/sage-slip-dress](https://billy-try-on.vercel.app/shop/sage-slip-dress)

### 6. Deciding before buying

On the slide:

- Deciding before buying
- Would you buy it?
- Save a look and record your verdict.  Compare two options side by side.
- Demo looks and example verdicts

Billy stores saved looks locally. Each look can carry a Would buy, Maybe or Wouldn’t buy verdict. In the web Studio, selecting two saved looks opens the side-by-side view shown here. The original-photo comparison also uses a draggable before-and-after slider. This is a live Studio capture using pre-existing demo images, with example verdicts entered solely for the demonstration. They are not user research results. The product does not currently export verdicts or record purchase outcomes.

Sources and assets:

- [web/components/studio/LooksShelf.tsx](../../web/components/studio/LooksShelf.tsx)
- [web/components/studio/CompareSlider.tsx](../../web/components/studio/CompareSlider.tsx)
- [web/lib/client/store.ts](../../web/lib/client/store.ts)
- [https://billy-try-on.vercel.app/studio](https://billy-try-on.vercel.app/studio)
- Live Studio capture on 10 October 2026 using AI-generated demo looks and example verdicts

### 7. SDG 12 and reuse

On the slide:

- SDG 12 and reuse
- 12.5
- Reduce waste through reuse
- Billy’s hypothesis
- A clearer preview may help shoppers choose pre-loved or surplus clothing they would otherwise pass over.
- Reuse and waste reduction are goals. Billy has not measured environmental impact.
- UN SDG 12, target 12.5

The United Nations defines SDG 12 as responsible consumption and production. Target 12.5 includes reducing waste through prevention, reduction, recycling and reuse. Billy’s proposed contribution is to make pre-loved and surplus garments easier to evaluate before purchasing. The connection is a product hypothesis. Billy has not measured reuse, returns, waste reduction or emissions. A shopper choosing to buy less is also a valid outcome. A later impact study would need verified purchase and reuse outcomes, including whether a pre-loved purchase replaces a newly produced item.

Sources and assets:

- [https://sdgs.un.org/goals/goal12](https://sdgs.un.org/goals/goal12) (target 12.5, accessed 10 October 2026)
- [README.md](../../README.md)
- [web/lib/catalogue.ts](../../web/lib/catalogue.ts)

### 8. What works today

On the slide:

- What works today
- Quick and Detailed previews
- Select a render quality with streamed previews.
- Outfit layering and saved looks
- Keep pieces on, then compare or share a look.
- Studio, extension and demo shop
- Try-on in Billy or inside the demo retailer.
- Optional live mirror
- Off on the live site. A real Decart session still needs testing.
- Demo stock. Visual fit is approximate.

The current main branch includes a web Studio, a Chrome Manifest V3 extension and the ÉTAGE demo store. Quick and Detailed rendering use OpenAI, with partial previews where the provider returns them. Keep it on reuses a finished preview as the base for the next garment so shoppers can layer an outfit. Saved looks support verdicts, side-by-side comparison and sharing through the system share sheet or clipboard. A live mirror implementation uses Decart with short-lived tokens and capped sessions. The deployed mirror is off, and the README records that a real Decart session has not been tested. Gemini is also wired up but untested. Personal photos and saved looks persist in browser storage. The browser strips EXIF data when normalising a photo, then sends the photo and garment to the server and image provider during generation. The application does not persist those images on its server, but provider handling is separate. Known readiness limits: the public endpoint incurs provider costs, per-IP limits are in memory, the remote-image guard checks hostnames rather than resolved IPs, and the extension requests all-URL access. The catalogue, sellers, prices and models are fictional demo content. Visual previews do not verify physical fit.

Sources and assets:

- [README.md](../../README.md)
- [web/app/api/try-on/route.ts](../../web/app/api/try-on/route.ts)
- [web/lib/client/images.ts](../../web/lib/client/images.ts)
- [web/components/studio/Studio.tsx](../../web/components/studio/Studio.tsx)
- [web/components/shop/TryOnDrawer.tsx](../../web/components/shop/TryOnDrawer.tsx)
- [web/components/mirror/Mirror.tsx](../../web/components/mirror/Mirror.tsx)
- [web/app/api/mirror/token/route.ts](../../web/app/api/mirror/token/route.ts)
- [extension/manifest.json](../../extension/manifest.json)
- [tests/screenshots/ext-2-panel-ready.png](../../tests/screenshots/ext-2-panel-ready.png)
- [https://billy-try-on.vercel.app/mirror](https://billy-try-on.vercel.app/mirror) (off on 10 October 2026)

### 9. Purchase confidence pilot

On the slide:

- Purchase confidence pilot
- Proposed study
- 12 shoppers
- People already shopping for pre-loved clothing.
- 3 garments
- The same listings with and without a preview. Alternate the order.
- 1 to 5 rating
- Confidence in the choice, plus a purchase verdict.
- Also record generation failures and time to decide.
- No customer results yet

This is a proposed small pilot, not a completed study. Recruit twelve people who already shop for pre-loved clothing and let each assess three garments. For each garment, collect a confidence rating from one to five and a Would buy, Maybe or Wouldn’t buy verdict. Compare a listing-only view with a listing plus Billy preview, counterbalancing the order to reduce the effect of seeing the item twice. Record generation time, failures and decision time. Keep the seller’s measurements and condition information available in both views. Include whether the output misrepresents the garment. The small sample can identify usability problems and directional changes, but it cannot establish environmental savings or population-wide effects. Record observations manually because verdict export and research analytics are not yet implemented. Follow up on purchases separately before claiming reuse outcomes.

Sources and assets:

- Proposed pilot design for this pitch. No customer or impact results are available.
- [README.md](../../README.md) (verdict export listed as a next step)
- [web/lib/client/store.ts](../../web/lib/client/store.ts) (current verdict values)

### 10. Billy demo

On the slide:

- Billy demo
- Try the Studio
- billy-try-on.vercel.app/studio
- Retailer demo
- billy-try-on.vercel.app/shop
- Chrome extension
- billy-try-on.vercel.app/extension
- Next: a pilot with real shoppers

Open the Studio link for the live demo. Choose the example Arjun or Mei model, select a garment from the demo feed, generate a look, save it and record a verdict. Keep it on can add another garment over the current outfit. Save a second look and compare them side by side. Show the ÉTAGE store to demonstrate the retailer flow, including the Billy drawer and local bag. Its checkout is disabled. Allow for provider latency and a possible rate-limit or provider error. Each live generation can incur API costs. The extension page contains the downloadable unpacked extension and installation instructions. Have the deck’s existing previews available as a fallback if live generation fails. The optional live mirror is off on the live site and still needs a real Decart test. Close with the proposed next step: test the product with real shoppers and connect real seller listings. These partnerships and the purchase-confidence study are future work.

Sources and assets:

- [https://billy-try-on.vercel.app/studio](https://billy-try-on.vercel.app/studio)
- [https://billy-try-on.vercel.app/shop](https://billy-try-on.vercel.app/shop)
- [https://billy-try-on.vercel.app/extension](https://billy-try-on.vercel.app/extension)
- [README.md](../../README.md)
- [web/public/looks/mei-denim-trucker.jpg](../../web/public/looks/mei-denim-trucker.jpg)

## Prototype readiness

Read the [root README](../../README.md) for the current limits before showing Billy outside a controlled demo. The public generation endpoint spends the provider key, its per-IP limiter is in memory, the image-fetch guard checks hostnames rather than resolved IPs, and the extension requests access to all URLs. These limits still apply. The live mirror needs a real Decart session test, and Gemini is wired up but untested. Verdict export, real seller feeds and the shopper pilot are future work.
