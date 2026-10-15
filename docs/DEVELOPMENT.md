# Developing Billy

[← Project README](../README.md)

Billy has a Next.js web app, an unpacked Chrome extension and small Node.js scripts. The catalogue, two example models and twelve showcase looks are committed, so a fresh checkout can display the demo without generating assets.

## Repository layout

```text
billy-try-on/
├── web/
│   ├── app/               Pages and API routes
│   ├── components/        Studio, mirror, store and shared UI
│   ├── lib/               Catalogue, provider, image and storage helpers
│   └── public/            Demo photos, showcase looks and extension ZIP
├── extension/             Chrome MV3 extension, no build step
├── scripts/               Image generation and extension packing
├── tests/                 Extension end-to-end script, fixtures and evidence
└── docs/                  Development guide, README assets and pitch deck
```

## Local setup

From the repository root:

```sh
npm ci
npm --prefix web ci
cp web/.env.example web/.env.local
# Set OPENAI_API_KEY in web/.env.local before a live try-on.
npm run dev
```

The app opens at [http://localhost:3000](http://localhost:3000). Use `npm --prefix web run dev -- --port 3100` for another port. The extension's gear menu can change its server, and its tests accept `BILLY_SERVER=http://localhost:3100`.

## Configuration

Use [web/.env.example](../web/.env.example) as the source of configuration names. Secrets belong in `web/.env.local` or the deployment's server environment, never client code.

| Variable | Default | Purpose |
| --- | --- | --- |
| `BILLY_TRYON_PROVIDER` | `openai` | Select `openai` or `gemini` |
| `OPENAI_API_KEY` | Unset | Required for OpenAI photo try-on and the catalogue asset script |
| `BILLY_OPENAI_MODEL` | `gpt-image-2` | OpenAI image model |
| `BILLY_OPENAI_QUALITY` | `medium` | Default quality for callers that omit a supported quality |
| `GEMINI_API_KEY` | Unset | Required when selecting Gemini |
| `BILLY_GEMINI_MODEL` | `gemini-3.1-flash-image` | Gemini image model |
| `BILLY_RATE_LIMIT_PER_HOUR` | `40` | Requests per IP per hour, in memory and per instance |
| `DECART_API_KEY` | Unset | Enables the optional live mirror |

The shopper controls send `low` for **Quick** and `medium` for **Detailed**, overriding the server's default. `high` is available through `BILLY_OPENAI_QUALITY` for callers that omit quality. The UI estimates roughly 10 seconds for Quick and 25 seconds for Detailed, but provider latency varies. Gemini returns a final image without partial previews. Provider availability and billing must be checked against the account you use.

Mirror entry points read whether a Decart key exists during page generation. Redeploy after changing that key so the generated pages match the server configuration.

## How photo try-on works

1. The browser re-encodes the person's photo as a JPEG of at most 1024px and strips EXIF metadata, including location. It stores the photo locally.
2. A garment arrives from the catalogue, an upload, a pasted image or image link, or the extension's hover, drag or right-click controls.
3. The extension's service worker fetches external garment images. The web flow can use a server-side fetch when the browser cannot read an image.
4. `POST /api/try-on` validates the images, selects the provider and builds a garment-specific prompt. Dresses replace the outfit and jackets layer over it, while the prompt asks the model to preserve the person's identity, pose and background.
5. With streaming enabled, the route returns newline-delimited JSON containing partial previews, then a final result or error. The clients fade previews into the photograph.
6. **Keep it on** uses the finished look as the base image for the next garment. Results also stay in the session strip until the page closes.

The application does not persist these images on its server. Requests transmit them to the configured provider, whose handling is separate from Billy's browser storage.

### API

| Endpoint | Behaviour |
| --- | --- |
| `GET /api/catalogue` | Return the fictional garment catalogue |
| `POST /api/try-on` | Generate a photo try-on, using JSON or an NDJSON stream |
| `GET /api/mirror/token` | Report whether the live mirror is enabled and its maximum session duration |
| `POST /api/mirror/token` | Mint a short-lived Decart client token when the mirror is configured |

A minimal try-on request selects a committed catalogue garment:

```json
{
  "person": "data:image/jpeg;base64,...",
  "garment": { "listingId": "denim-trucker" },
  "quality": "low",
  "stream": true
}
```

`person` must be a JPEG, PNG or WebP data URL under 8 MB. Garment input can be `listingId`, `image` as a data URL, or `url` with an optional `pageUrl`, `title` and `category`. Supported categories are `top`, `outerwear`, `dress`, `bottom` and `auto`. An invalid quality falls back to the server default.

Without `stream: true`, success returns `{ image, provider, model, ms }` and failures return `{ error }` with an HTTP error status. Streaming responses use `application/x-ndjson`:

```json
{"type":"partial","image":"data:image/jpeg;base64,..."}
{"type":"done","image":"data:image/jpeg;base64,...","provider":"openai","model":"gpt-image-2","ms":10000}
```

The values above illustrate the response format, not a measured render. There may be no partial events. A provider failure after the stream opens is an event such as `{"type":"error","error":"...","status":502}`. Request validation can still return a regular JSON error before the stream starts, and cancelling a streamed request also cancels the upstream call. The route allows up to 120 seconds and provider requests have a 110-second timeout.

## Storage and the demo store

The web app shares the person's photo and saved looks through the `billy` IndexedDB database using `idb-keyval`. The extension uses `chrome.storage.local`, so its saved state is separate. Saved looks can include a `yes`, `maybe` or `no` verdict. Sharing uses the system share sheet when file sharing is supported, with a clipboard fallback.

ÉTAGE at `/shop` is a fictional retailer for pre-owned and last-season stock. Its black-and-white pages use the catalogue through [web/lib/shop.ts](../web/lib/shop.ts). Every product has a showcase model photo in `web/public/looks/`.

**Try on** opens a Billy drawer, asks for a photo once and streams the result. **Wear it with** layers a matching piece over that look, and **Add to bag** returns to the store. Tried items show **On you** on cards and **You** on product pages. Those previews share IndexedDB with the Studio. The bag uses localStorage and checkout is disabled.

## Live mirror

`/mirror` streams camera video to Decart's `lucy-vton-latest` model through `@decartai/sdk`. It supports garment changes without reconnecting, still captures and six-second recordings. The SDK and its LiveKit dependencies load when the shopper starts the mirror.

The token endpoint mints a 60-second client token restricted to the model and, when supplied, the request's origin. It never returns the server's Decart key. Both token constraints and the page cap sessions at `MIRROR_MAX_SECONDS`, currently 120 seconds. The page stops streaming when hidden. Mirror token requests use the same per-IP limiter implementation as photo try-on, with a separate `mirror:` bucket.

Without a Decart key, mirror entry points are hidden and the page explains that the feature is off. Streaming incurs provider charges. A real Decart session remains unvalidated, so check the full flow with a funded account before a live demonstration.

## Checks

Run lint and the production build from the repository root:

```sh
npm --prefix web run lint
npm --prefix web run build
```

With the development server running in another terminal, use the existing extension suite:

```sh
npm run test:extension -- --skip-generate
```

This loads the unpacked extension in Playwright Chromium and checks onboarding, the catalogue, hover controls, drag-and-drop, streamed previews, quality selection, detailed re-rendering, saved looks and sharing. Mock screenshots go to ignored `tests/screenshots/mock/`, preserving the existing real-model evidence. If Chromium is missing, install it with `npx playwright install chromium`.

Omit `--skip-generate` to include a live try-on, which spends provider credits. Use `BILLY_SERVER` to point the suite at another server and `BILLY_EXTENSION_PATH` to test an extracted extension download. Check the right-click context menu and native side panel opening manually in Chrome. A mocked run does not validate image quality, funded providers or the live mirror.

## Generating assets

The existing image helper reads `web/.env.local`. From the repository root:

```sh
npm run assets
npm run looks
```

`assets` creates twelve garment photos and two example models with OpenAI, skipping existing files. `looks` calls the running app's `/api/try-on` for twelve showcase looks and also skips existing files. Both can spend API credits when a file needs generating. `assets` uses macOS `sips` to normalise images into small JPEGs, so that script requires macOS.

Select a catalogue asset with `npm run assets -- --only denim-trucker` or deliberately overwrite it with `--force`. To regenerate looks, use `npm run looks -- http://localhost:3000 --force`. These flags replace existing images. The [README asset guide](assets/README.md) records the separate built-in image generation prompts for the cover and share card.

## Packing and deployment

After changing `extension/`, regenerate the committed download:

```sh
npm run pack:extension
```

This creates `web/public/billy-extension.zip` with `https://billy-try-on.vercel.app` as its default server. The original unpacked source retains localhost. `npm run pack:extension:local` creates a download pointing at localhost instead. For your own host, use `node scripts/pack-extension.mjs --server https://your-domain.example` and inspect the generated ZIP before publishing it.

On Vercel, set the project root to `web`, use its [Next.js framework configuration](../web/vercel.json) and configure the server environment variables. Keep `OPENAI_API_KEY` private and choose an appropriate `BILLY_RATE_LIMIT_PER_HOUR` for the demo. Add `DECART_API_KEY` only when enabling the mirror, then redeploy to update the page entry points.

The root command `npm run deploy` repacks the production extension and runs `vercel deploy --prod`. It publishes to the Vercel project configured on the machine, so confirm that destination before running it. Normal web setup, documentation checks and extension tests do not require deployment.

## Known limits

- Live photo try-on is a public, paid-provider endpoint with only an in-memory per-IP limiter. Limits reset on restart and are separate across server instances.
- The server-side image guard rejects private hostnames, but does not validate DNS resolution or redirect destinations. Downloads follow redirects and the size check happens after buffering.
- The extension requests `<all_urls>` for product images across stores. A store release needs a deliberate permission model.
- Gemini is implemented but has not completed funded provider validation. A real Decart mirror session also remains untested.
- Image generation can misrepresent clothing and does not establish physical fit, garment condition or availability.
- All listings, sellers, prices, models and showcase images are demo content. The local bag does not provide checkout.
- Saved-look verdict export, real seller feeds and shopper research are future work. Billy has no measured customer or environmental outcomes.

See the [project roadmap](../README.md#roadmap) and [pitch notes](slides/README.md) for the proposed next steps.
