# Billy

Billy is a virtual try-on Chrome extension for pre-loved and surplus clothing. A shopper adds one photo of themselves, then drags a garment photo from any shop or resale listing onto it, and Billy generates a picture of them wearing it. Looks can be saved, rated ("Would you buy it?") and compared side by side before buying. It was built for SDG 12 (Challenge Statement 2) and modelled on [Anywear](https://anywear.decart.ai/), which does live-camera try-on with Decart's realtime model; Billy uses a photo instead, so it runs on any image API and any laptop.

```
billy/
  web/         Next.js 16 app: landing page, studio, pre-loved feed, listing pages, try-on API
  extension/   Chrome MV3 extension (no build step): content script, side panel, service worker
  scripts/     Asset generation, showcase looks, extension packing
  tests/       Playwright end-to-end test for the extension, plus its screenshots
```

## Run it

```bash
cd web
npm install
cp .env.example .env.local   # add OPENAI_API_KEY
npm run dev                  # http://localhost:3000
```

Load the extension: open `chrome://extensions`, switch on Developer mode, press **Load unpacked** and choose `extension/`. Click Billy in the toolbar to open the side panel and add a photo (or borrow one of the two AI-generated example models). The extension talks to `http://localhost:3000` by default; change it from the gear icon in the side panel. The web app also serves the extension as a zip at `/billy-extension.zip` with install steps at `/extension`.

## How a try-on works

1. The shopper's photo is re-encoded in the browser as a JPEG of at most 1024px. That strips EXIF data, including location. The photo is kept in IndexedDB (web) or `chrome.storage.local` (extension).
2. The garment arrives in one of these ways:
   - a hover **Try on** button on any product photo
   - dragging the photo onto Billy's drop target, either in the page or in the side panel
   - the right-click menu **Try on with Billy**
   - an upload, an image link or a paste
3. The extension's service worker downloads the garment image itself, so cross-origin images work. It falls back to a server-side fetch, which refuses private hosts.
4. `POST /api/try-on` sends both images to the image model. A prompt keeps the person's identity, pose and background, copies the garment faithfully, and applies a rule for the garment type: dresses replace the whole outfit, jackets layer on top. Nothing is stored on the server.

| Provider | Model | Notes |
| --- | --- | --- |
| `openai` (default) | `gpt-image-2` via `/v1/images/edits` | About 25s per look at `medium` quality |
| `gemini` | `gemini-3.1-flash-image` | Wired up but untested: the available key had no prepaid credits on 2026-10-10 |

Switch with `BILLY_TRYON_PROVIDER`. The server applies a per-IP hourly limit (`BILLY_RATE_LIMIT_PER_HOUR`, default 40).

## Scripts

From the repo root:

| Command | What it does |
| --- | --- |
| `npm run assets` | Generates the 12 catalogue garments and 2 example models with `gpt-image-2` (skips existing files) |
| `npm run looks` | Renders the 8 landing-page looks through the running app's own `/api/try-on` |
| `npm run pack:extension` | Rebuilds `web/public/billy-extension.zip`. Run it after changing `extension/` |
| `npm run test:extension` | Loads the extension in Playwright's Chromium against a mock shop page and checks 13 behaviours, including one real try-on. Needs `npm run dev`. Add `-- --skip-generate` to skip the paid call |

## Demo data

All garment photos, the two models (Mei and Arjun) and every look on the site are AI-generated. Sellers, prices and listings are fictional and are labelled as demo data on the listing pages and in the footer.

## Known limits

- The rate limiter is in memory, so it resets on deploy and is per instance on serverless hosts.
- The server-fetch guard checks hostnames, not resolved IPs.
- The extension asks for `<all_urls>` so it can read product images on any shop. A store release would need to justify that or switch to `activeTab`.
- The right-click menu and the in-page **Open Billy** button (`chrome.sidePanel.open` from a content-script click) are not covered by the automated test. Check them by hand in Chrome.

## Next steps

- Live mirror mode with Decart's realtime `lucy-vton-latest` (WebRTC camera stream plus garment image), which is what Anywear does. It needs a `DECART_API_KEY` and a token-minting route.
- Real seller feeds (resale-platform exports, retailer surplus CSVs) instead of `web/lib/catalogue.ts`.
- Export saved-look verdicts so the purchase-confidence test in the pitch can be run with real shoppers.
