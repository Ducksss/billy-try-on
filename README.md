# Billy

Billy is a virtual try-on Chrome extension for pre-loved and surplus clothing. A shopper adds one photo of themselves, then drags a garment photo from any shop or resale listing onto it, and Billy generates a picture of them wearing it. A quick render takes about 10 seconds and the look sharpens on screen as it renders. Pieces can be kept on and layered into an outfit, and looks can be saved, rated ("Would you buy it?"), shared and compared side by side before buying. It was built for SDG 12 (Challenge Statement 2) and modelled on [Anywear](https://anywear.decart.ai/), which does live-camera try-on with Decart's realtime model. Billy works from a photo, so it runs on any image API and any laptop; an optional live mirror (`/mirror`) adds the camera version when a Decart key is set.

Live: **https://billy-try-on.vercel.app** (extension download at [/extension](https://billy-try-on.vercel.app/extension)).

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
cp .env.example .env.local   # add OPENAI_API_KEY (and DECART_API_KEY for the live mirror)
npm run dev                  # http://localhost:3000
```

Load the extension: open `chrome://extensions`, switch on Developer mode, press **Load unpacked** and choose `extension/`. Click Billy in the toolbar to open the side panel and add a photo (or borrow one of the two AI-generated example models). Loaded from the repo, the extension talks to `http://localhost:3000`. The zip served at `/billy-extension.zip` is packed with the production server baked in. Either can be repointed from the gear icon in the side panel.

## Deploy

The web app deploys to the Vercel project `billy-try-on` (team `ducksss-projects`) from `web/`. `web/vercel.json` pins the Next.js framework preset. Production env vars: `OPENAI_API_KEY`, `BILLY_TRYON_PROVIDER=openai`, `BILLY_OPENAI_MODEL=gpt-image-2`, `BILLY_OPENAI_QUALITY=medium`, `BILLY_RATE_LIMIT_PER_HOUR=20`. Optional: `DECART_API_KEY` turns on the live mirror. Pages read it at build time, so redeploy after adding it.

```bash
npm run deploy   # repacks the extension zip for production, then vercel deploy --prod from web/
```

## How a try-on works

1. The shopper's photo is re-encoded in the browser as a JPEG of at most 1024px. That strips EXIF data, including location. The photo is kept in IndexedDB (web) or `chrome.storage.local` (extension).
2. The garment arrives in one of these ways:
   - a hover **Try on** button on any product photo
   - dragging the photo onto Billy's drop target, either in the page or in the side panel
   - the right-click menu **Try on with Billy**
   - an upload, an image link or a paste
3. The extension's service worker downloads the garment image itself, so cross-origin images work. It falls back to a server-side fetch, which refuses private hosts.
4. `POST /api/try-on` sends both images to the image model. A prompt keeps the person's identity, pose and background, copies the garment faithfully, and applies a rule for the garment type: dresses replace the whole outfit, jackets layer on top. Nothing is stored on the server.
5. With `"stream": true` the route answers in newline-delimited JSON: `partial` previews while the model renders (OpenAI's `partial_images`), then `done` or `error`. The studio and extension fade the previews in over the photo. Without `stream` it returns one JSON object, as before, and the extension falls back to that for older servers.
6. Shoppers choose **Quick** (`quality: "low"`, about 10s, the default) or **Detailed** (`"medium"`, about 25s). A quick result offers **Render in detail**. `BILLY_OPENAI_QUALITY` sets the default for callers that don't ask; `high` is only reachable through that variable.
7. **Keep it on** in the studio makes the finished look the base photo for the next garment, so a jacket can go over a dress. Every result in the session stays in a strip under the photo until the page is closed.

| Provider | Model | Notes |
| --- | --- | --- |
| `openai` (default) | `gpt-image-2` via `/v1/images/edits` | About 10s per look at `low`, 25s at `medium`. At `low` the model sometimes finishes before sending any preview |
| `gemini` | `gemini-3.1-flash-image` | Wired up but untested: the available key had no prepaid credits on 2026-10-10 |

Switch with `BILLY_TRYON_PROVIDER`. The server applies a per-IP hourly limit (`BILLY_RATE_LIMIT_PER_HOUR`, default 40). Gemini doesn't stream, so it only sends `done`.

`gpt-image-2.5-flare` is also available on the key. One quick render took 8.6s with comparable quality but sent no preview; try it with `BILLY_OPENAI_MODEL` before switching.

## Live mirror

`/mirror` streams the shopper's camera to Decart's realtime try-on model (`lucy-vton-latest`, through `@decartai/sdk`) and plays back video of them wearing the garment. They can switch garments without reconnecting, record a 6-second clip to share or download, or save a still to their looks.

- `POST /api/mirror/token` mints a 60-second client token restricted to the model and the page's origin, so `DECART_API_KEY` never reaches the browser. `GET` on the same route reports whether the mirror is switched on; the extension's side panel uses it to show a **Try it live** link.
- Decart bills about $0.02 per second of streaming. Sessions are capped at 2 minutes (`MIRROR_MAX_SECONDS` in `web/lib/mirror.ts`, enforced in the token and in the page), stop when the tab is hidden, and count against the same per-IP hourly limit as try-ons.
- Without the key, the entry points in the studio and on listing pages are hidden and `/mirror` explains that it is off.
- The SDK (and LiveKit under it) is loaded only when someone presses **Start the mirror**.

## Scripts

From the repo root:

| Command | What it does |
| --- | --- |
| `npm run assets` | Generates the 12 catalogue garments and 2 example models with `gpt-image-2` (skips existing files) |
| `npm run looks` | Renders the 8 landing-page looks through the running app's own `/api/try-on` |
| `npm run pack:extension` | Rebuilds `web/public/billy-extension.zip` pointing at production. Run it after changing `extension/` |
| `npm run pack:extension:local` | Same, but the zip defaults to `http://localhost:3000` |
| `npm run test:extension` | Loads the extension in Playwright's Chromium against a mock shop page and checks 17 behaviours (18 with the mock), including one real try-on, streamed previews, the quality toggle and Render in detail. Needs `npm run dev`; `BILLY_SERVER=http://localhost:3100` points it at another port. Add `-- --skip-generate` to skip the paid call |

## Demo data

All garment photos, the two models (Mei and Arjun) and every look on the site are AI-generated. Sellers, prices and listings are fictional and are labelled as demo data on the listing pages and in the footer.

## Known limits

- The production try-on endpoint is public and spends the OpenAI key on every call. The only guard is the in-memory per-IP limit (20 an hour in production), which resets on deploy and is per instance.
- The server-fetch guard checks hostnames, not resolved IPs.
- The extension asks for `<all_urls>` so it can read product images on any shop. A store release would need to justify that or switch to `activeTab`.
- The right-click menu and the in-page **Open Billy** button (`chrome.sidePanel.open` from a content-script click) are not covered by the automated test. Check them by hand in Chrome.
- The live mirror has not run against a real Decart session: no key was available on 2026-10-10. The token route was checked against Decart's live API (a fake key gets its 401), and the page was checked up to the connect step with a synthetic camera. Test it with a real key before showing it.
- "Ask a friend" uses the system share sheet where the browser can share files, and copies the image to the clipboard elsewhere.

## Next steps

- "Make it a video" from a still look. OpenAI's video API (Sora) was shut down on 2026-09-24 (`/v1/videos` returns 404), so this needs another provider: Veo 3.1 Lite through the existing Gemini key once billing is on (about $0.05/s at 720p), FASHN's image-to-video (`FASHN_API_KEY`), or Kling through fal (`FAL_KEY`). The live mirror's clip recorder covers the same need at no extra cost.
- A phone-as-camera mode for the mirror (QR code to open `/mirror` on a phone), as in Decart's digital-mirror example.
- Open-source video try-on models (MagicTryOn, ViViD, CatV2TON) have no hosted APIs and most are non-commercial; not worth self-hosting yet.
- Real seller feeds (resale-platform exports, retailer surplus CSVs) instead of `web/lib/catalogue.ts`.
- Export saved-look verdicts so the purchase-confidence test in the pitch can be run with real shoppers.
