import { addLook, blobToJpegDataUrl, dataUrlToBlob, getMe, getQuality, getServerUrl } from "./shared.js";

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({ id: "billy-try-on", title: "Try on with Billy", contexts: ["image"] });
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

  // Chrome only injects content scripts into pages loaded after install, so add
  // Billy to tabs that are already open.
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  for (const tab of tabs) {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }).catch(() => {});
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "billy-try-on" || !tab?.id) return;
  const garment = { url: info.srcUrl, pageUrl: info.pageUrl, title: tab.title };
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "billy:start", garment });
  } catch {
    // No content script on this page (e.g. a raw image tab): run it in the side panel.
    await chrome.storage.session.set({ pending: { ...garment, at: Date.now() } });
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    "billy:me": async () => ({ me: await getMe() }),
    "billy:tryon": () => tryOn(message.garment, { jobId: message.jobId, quality: message.quality, tabId: sender.tab?.id }),
    "billy:save-look": () => saveLook(message),
    "billy:open-panel": async () => {
      await chrome.sidePanel.open({ tabId: sender.tab.id });
      return { ok: true };
    },
  };
  const handler = handlers[message?.type];
  if (!handler) return false;
  handler().then(sendResponse, (err) => sendResponse({ error: err?.message || String(err) }));
  return true;
});

// Turns whatever the page gave us into a JPEG data URL. The extension can read
// cross-origin images that a web page can't; if even that fails, the server tries.
async function garmentImage(garment) {
  if (garment.image) return garment.image;
  if (!garment.url) return null;
  try {
    const res = await fetch(garment.url, { credentials: "omit" });
    if (!res.ok) throw new Error(String(res.status));
    return await blobToJpegDataUrl(await res.blob());
  } catch {
    return null;
  }
}

// Rough previews stream back while the look renders. They go to whichever surface asked:
// the page's content script, or the side panel (an extension page).
function notify(tabId, message) {
  const sent = tabId ? chrome.tabs.sendMessage(tabId, message) : chrome.runtime.sendMessage(message);
  sent?.catch?.(() => {});
}

async function readTryOnStream(res, onPartial) {
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (!line) continue;
      const event = JSON.parse(line);
      if (event.type === "partial") onPartial(event.image);
      else if (event.type === "done" || event.type === "error") return event;
    }
  }
  return { error: "The connection closed before your look was ready. Try again." };
}

async function tryOn(garment, { jobId, quality, tabId } = {}) {
  const person = await getMe();
  if (!person) return { error: "no-photo" };
  const server = await getServerUrl();
  // A try-on takes 10-25s; keep the service worker from idling out mid-request.
  const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(), 20_000);
  try {
    const image = await garmentImage(garment);
    const body = {
      person,
      quality: quality ?? (await getQuality()),
      stream: true,
      garment: {
        image: image ?? undefined,
        url: image ? undefined : garment.url,
        pageUrl: garment.pageUrl,
        title: garment.title,
        category: garment.category,
        listingId: garment.listingId,
      },
    };
    let res;
    try {
      res = await fetch(`${server}/api/try-on`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      return { error: `Can't reach Billy's server at ${server}. Start it, or change the address in Billy's settings.` };
    }
    // Servers that predate streaming answer with plain JSON.
    let json;
    if (res.ok && res.headers.get("content-type")?.includes("ndjson")) {
      json = await readTryOnStream(res, (preview) => notify(tabId, { type: "billy:partial", jobId, image: preview })).catch(() => ({
        error: "The connection to Billy's server dropped. Try again.",
      }));
    } else {
      json = await res.json().catch(() => ({}));
      if (!res.ok) return { error: json.error || `Billy's server returned ${res.status}.` };
    }
    if (json.error || !json.image) return { error: json.error || "Try-on failed." };
    return { image: json.image, ms: json.ms, quality: body.quality, garmentImage: image };
  } finally {
    clearInterval(keepAlive);
  }
}

async function saveLook({ image, garment, verdict }) {
  let thumb = null;
  try {
    const source = garment.image ? await dataUrlToBlob(garment.image) : await (await fetch(garment.url)).blob();
    thumb = await blobToJpegDataUrl(source, 320, 0.85);
  } catch {
    thumb = garment.url ?? null;
  }
  await addLook({
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    image,
    verdict,
    garment: {
      title: garment.title || "Garment",
      image: thumb,
      sourceUrl: garment.listingUrl || garment.pageUrl,
      listingId: garment.listingId,
      price: garment.price,
    },
  });
  return { ok: true };
}
