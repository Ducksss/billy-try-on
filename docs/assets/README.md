# Billy README assets

[← Project README](../../README.md)

These assets were prepared on 10 October 2026 for the project README and repository sharing. The cover and social card were made with the built-in image generation tool. They are editorial artwork based on the existing AI-generated demo photographs, rather than screenshots or evidence from real shoppers.

| File | Purpose | Source |
| --- | --- | --- |
| [readme-cover.jpg](readme-cover.jpg) | Wide README cover, 1942 × 809 | Generated composition of Mei, the denim jacket and its existing try-on look |
| [social-card.jpg](social-card.jpg) | Repository or social share image, 1200 × 630 | Generated adaptation of the cover |
| [studio.png](studio.png) | README product screenshot, 1440 × 960 | Local production `/studio`, example model Mei, garment feed, no paid rendering |
| [shop.png](shop.png) | Retailer demo screenshot, 1440 × 960 | Local production `/shop#woman`, fictional ÉTAGE store |
| [Extension side panel](../../tests/screenshots/ext-2-panel-ready.png) | Additional product evidence | Existing extension test capture, reused without duplication |
| [Billy logo](../../web/app/icon.svg) | README header | Existing application icon, reused without changing the brand |

The share card can be used as the repository's social preview. The original generated PNGs remain in the local image generation library. The committed JPEGs are compressed copies with no changes to their artwork.

## Reference photographs

The cover uses these committed inputs in this order:

1. [Mei's original photo](../../web/public/models/mei.jpg)
2. [Denim jacket](../../web/public/catalogue/denim-trucker.jpg)
3. [Mei wearing the jacket](../../web/public/looks/mei-denim-trucker.jpg)

## Generation prompts

### Cover

```text
Use case: compositing
Asset type: GitHub README cover for Billy, an existing virtual try-on app for pre-loved and surplus clothing.
Primary request: Turn the three reference images into one finished, beautifully art-directed, wide landscape brand cover, about 2.4:1. This is editorial cover artwork, not a screenshot.
Input images: Image 1 is the original AI example model Mei. Image 2 is the denim garment product photograph. Image 3 is Mei wearing that jacket, the existing Billy try-on result. Use the supplied photographs faithfully rather than inventing a new model or a different garment.
Scene/backdrop: Warm off-white paper (#f3f3f1), quiet fashion editorial design. Billy's brand has charcoal (#141413) typography and burnt-orange (#c2401f) accents.
Composition/framing: The left third has generous whitespace with a bold lowercase "billy" wordmark and the headline beneath, plus a tiny product description. The right two thirds show a clean visual equation: the original portrait in a tall softly rounded frame, a smaller jacket product frame, then the actual jacket-wearing result in a tall frame. Small restrained orange plus and arrow marks connect them. All people shown head to shoes, identical photographic proportions, no stretched faces. Large precise sans-serif typography, handsome editorial spacing, simple pale frames with extremely subtle shadows. Keep everything inside a generous outer margin.
Text (verbatim): "billy"; "Try on pre-loved\nbefore you buy."; "Virtual try-on for pre-loved and surplus clothing."
Constraints: Preserve each source photograph's face, hair, body, garment, pose and background. No invented app interfaces, browser chrome, extra people, badges, environmental claims, logos or watermarks. Keep copy exact, highly readable even when displayed at 900px wide. Avoid busy decoration, gradients and glossy 3D.
```

### Social card

```text
Use case: compositing
Asset type: Billy repository social preview, a finished landscape share card with a 1200:630 canvas ratio.
Primary request: Reformat the supplied Billy cover into a polished social card. Keep its warm off-white background (#f3f3f1), charcoal type (#141413), burnt-orange accents (#c2401f) and faithful before-plus-garment-to-after photographs. This is editorial brand artwork, not a screenshot.
Input images: Image 1 is the existing Billy cover. Preserve its three photographs, model identity, denim garment and exact try-on result. Rearrange and resize the frames as needed for this aspect ratio, preserving each photograph's proportions and keeping head to shoes visible.
Composition/framing: Large lowercase "billy" at top left, the headline below in clear bold sans-serif type, and the compact image equation across the right half. Generous margins with nothing cropped at the edge. Refined editorial spacing and very light shadows. The headline must read clearly at social thumbnail size.
Text (verbatim): "billy"; "Try on pre-loved\nbefore you buy."; "billy-try-on.vercel.app"
Constraints: Use only those three text elements and the existing imagery. Do not add interfaces, watermarks, feature claims or environmental claims. Make the canvas ratio exactly 1200:630. Avoid gradients, decorative clutter and stretching people's faces.
```

## Screenshot capture

Build the app with `npm --prefix web run build`, then run `npm --prefix web run start -- --port 3100` and open it in Playwright Chromium. Use a 1440 × 960 viewport, a light colour scheme and reduced motion. On `/studio`, choose **Mei** and wait for the model and catalogue images to load. Capture the page before selecting a garment, so no provider call is required. On `/shop`, choose **Shop woman** and capture the department once the product photographs load. The production server keeps development tools out of these captures without changing application code.

The screenshots show the actual rendered application. They do not insert generated interfaces, render mocked try-on results or use personal photos. Recapture them when these screens materially change. Keep the distinction between editorial artwork, demo photographs and browser captures in the README captions.

## Verification

Before delivering the README, check local file links and section anchors, decode every referenced local image, and inspect the rendered Markdown at desktop and phone widths. The cover should remain readable in a typical 900px GitHub content column, and the social card must be 1200 × 630 with no stretched photographs.
