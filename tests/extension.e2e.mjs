// End-to-end check of the Chrome extension against a running web app.
// Usage: npm run dev (in another terminal), then npm run test:extension [-- --skip-generate]
// BILLY_SERVER=https://... points the extension at a deployed server instead of localhost:3000.
// --skip-generate answers try-ons from a local mock instead of the paid image model.
// Screenshots land in tests/screenshots/.
import { createServer } from "node:http";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// BILLY_EXTENSION_PATH tests a packed build (e.g. the unzipped download) instead of extension/.
const extensionPath = process.env.BILLY_EXTENSION_PATH ?? join(root, "extension");
const skipGenerate = process.argv.includes("--skip-generate");
// Mock runs write to their own folder so they never overwrite real-model evidence.
const shots = join(root, skipGenerate ? "tests/screenshots/mock" : "tests/screenshots");
mkdirSync(shots, { recursive: true });
const results = [];

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
}

const fixture = readFileSync(join(root, "tests/fixtures/shop.html"));
const MOCK = "http://127.0.0.1:4173";
const mockLook = `data:image/jpeg;base64,${readFileSync(join(root, "tests/fixtures/mock-look.jpg"), "base64")}`;
let mockCalls = 0;
// Serves the fixture shop page, and stands in for Billy's /api/try-on when mocking.
const shop = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/try-on") {
    mockCalls++;
    req.resume();
    req.on("end", () =>
      setTimeout(() => res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ image: mockLook, ms: 2500 })), 2500),
    );
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html" }).end(fixture);
});
await new Promise((r) => shop.listen(4173, "127.0.0.1", r));

const profile = mkdtempSync(join(tmpdir(), "billy-e2e-"));
const context = await chromium.launchPersistentContext(profile, {
  channel: "chromium",
  headless: true,
  viewport: { width: 1280, height: 860 },
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

try {
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent("serviceworker");
  const workerErrors = [];
  worker.on("console", (m) => m.type() === "error" && workerErrors.push(m.text()));
  const extensionId = worker.url().split("/")[2];
  check("service worker registered", !!extensionId, extensionId);
  // A packed build keeps its baked-in default server unless BILLY_SERVER overrides it.
  const server = process.env.BILLY_SERVER ?? (process.env.BILLY_EXTENSION_PATH ? null : "http://localhost:3000");
  if (server) await worker.evaluate((url) => chrome.storage.local.set({ serverUrl: url }), server);

  // Side panel page, opened as a tab at side-panel width.
  const panel = await context.newPage();
  await panel.setViewportSize({ width: 400, height: 860 });
  await panel.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await panel.waitForSelector("#onboard:not([hidden])");
  await panel.screenshot({ path: join(shots, "ext-1-onboarding.png") });
  check("panel shows onboarding without a photo", true);

  await panel.click('[data-model="mei"]');
  await panel.waitForSelector("#studio:not([hidden])", { timeout: 10_000 });
  await panel.screenshot({ path: join(shots, "ext-2-panel-ready.png") });
  check("example model sets the photo", true);

  // Feed tab pulls the catalogue from the server.
  await panel.click('[data-view="feed"]');
  await panel.waitForSelector("#feed li", { timeout: 10_000 });
  check("feed loads catalogue", (await panel.locator("#feed li").count()) >= 10);
  await panel.screenshot({ path: join(shots, "ext-3-feed.png") });
  await panel.click('[data-view="try"]');
  const useMock = () => panel.evaluate((url) => chrome.storage.local.set({ serverUrl: url }), MOCK);
  if (skipGenerate) await useMock();

  // A shop page: hover the product photo (under a transparent overlay) and press Try on.
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/product");
  await page.waitForFunction(() => document.querySelector("billy-root")?.shadowRoot);
  const box = await page.locator("#product").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const pill = page.locator("billy-root .pill");
  await pill.waitFor({ state: "visible", timeout: 5_000 });
  check("Try on button appears over a covered product photo", true);
  await page.screenshot({ path: join(shots, "ext-4-hover-pill.png") });

  // Hovering a small thumbnail must not show the button.
  const thumb = await page.locator(".thumbs img").boundingBox();
  await page.mouse.move(thumb.x + 10, thumb.y + 10);
  await page.waitForTimeout(600);
  check("no button on small thumbnails", !(await pill.isVisible()));

  // Dragging the photo shows the drop target with the shopper's photo in it.
  await page.evaluate(() => {
    const dt = new DataTransfer();
    document.querySelector("#product").dispatchEvent(new DragEvent("dragstart", { dataTransfer: dt, bubbles: true }));
  });
  const zone = page.locator("billy-root .zone");
  await zone.waitFor({ state: "visible", timeout: 5_000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, "ext-5-drop-zone.png") });
  check("drop target appears while dragging a product photo", true);
  await page.evaluate(() => document.querySelector("#product").dispatchEvent(new DragEvent("dragend", { bubbles: true })));
  await zone.waitFor({ state: "hidden", timeout: 5_000 });

  {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await pill.waitFor({ state: "visible" });
    await pill.click();
    const card = page.locator("billy-root .card");
    await card.waitFor({ state: "visible" });
    await page.locator("billy-root .card .status").waitFor({ state: "visible" });
    await page.screenshot({ path: join(shots, "ext-6-generating.png") });
    check("result card shows progress", true);

    const started = Date.now();
    await page.locator("billy-root .card .compare").waitFor({ state: "visible", timeout: 120_000 });
    check(`try-on result returned from ${skipGenerate ? "the mock" : "the server"}`, true, `${((Date.now() - started) / 1000).toFixed(1)}s`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(shots, "ext-7-result.png") });

    await page.locator("billy-root .card .save").click();
    await page.waitForFunction(() => document.querySelector("billy-root").shadowRoot.querySelector(".save").textContent === "Saved", null, {
      timeout: 15_000,
    });
    const looks = await panel.evaluate(async () => (await chrome.storage.local.get("looks")).looks ?? []);
    check("look saved to extension storage", looks.length === 1, `${looks.length} look(s), thumb ${looks[0]?.garment?.image?.slice(0, 22)}`);

    await panel.click('[data-view="looks"]');
    await panel.waitForSelector("#looks li");
    await panel.screenshot({ path: join(shots, "ext-8-looks.png") });
    check("panel Looks tab lists the saved look", true);
  }

  // Dropping a page image into the side panel runs a try-on there (always against the mock).
  await useMock();
  const callsBefore = mockCalls;
  await panel.click('[data-view="try"]');
  await panel.evaluate(() => {
    const dt = new DataTransfer();
    dt.setData("text/uri-list", "http://localhost:3000/catalogue/breton-tee.jpg");
    const stage = document.getElementById("stage");
    stage.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, bubbles: true, cancelable: true }));
    stage.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
  });
  await panel.waitForSelector("#status:not([hidden])", { timeout: 5_000 });
  await panel.screenshot({ path: join(shots, "ext-9-panel-drop-running.png") });
  await panel.waitForSelector("#result:not([hidden])", { timeout: 15_000 });
  await panel.screenshot({ path: join(shots, "ext-10-panel-result.png") });
  check("drop into side panel runs a try-on and shows the result", mockCalls === callsBefore + 1, `${mockCalls - callsBefore} mock call`);

  check("no service worker errors", workerErrors.length === 0, workerErrors.join(" | "));
} catch (err) {
  check("unexpected error", false, err.message);
} finally {
  await context.close();
  shop.close();
  rmSync(profile, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
