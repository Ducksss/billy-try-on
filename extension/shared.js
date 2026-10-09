// Shared by the service worker and the side panel (both are ES module contexts).

export const DEFAULT_SERVER = "http://localhost:3000";

export async function getServerUrl() {
  const { serverUrl } = await chrome.storage.local.get("serverUrl");
  return (serverUrl || DEFAULT_SERVER).replace(/\/+$/, "");
}

export async function getMe() {
  const { me } = await chrome.storage.local.get("me");
  return me ?? null;
}

export async function getLooks() {
  const { looks } = await chrome.storage.local.get("looks");
  return looks ?? [];
}

export async function addLook(look) {
  const looks = await getLooks();
  await chrome.storage.local.set({ looks: [look, ...looks] });
  return look;
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// Re-encodes any decodable image as a JPEG on white, no larger than maxSide.
// Works in the service worker (OffscreenCanvas) and in pages.
export async function blobToJpegDataUrl(blob, maxSide = 1024, quality = 0.9) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const out = await canvas.convertToBlob({ type: "image/jpeg", quality });
  return `data:image/jpeg;base64,${bytesToBase64(new Uint8Array(await out.arrayBuffer()))}`;
}

export async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
