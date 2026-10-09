// Browser-side image helpers: every photo is re-encoded as a JPEG no larger than
// `maxSide`, which keeps uploads small and strips EXIF (including location).
export async function normalizeImage(source: Blob, maxSide = 1024, quality = 0.9): Promise<string> {
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export async function fetchAsDataUrl(url: string, maxSide = 1024) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load ${url}`);
  return normalizeImage(await res.blob(), maxSide);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

// Opens the system share sheet with the image where the browser supports sharing files
// (phones, Chrome on Windows and ChromeOS). Elsewhere it copies the image to the clipboard.
export async function shareImage(dataUrl: string, { title, text }: { title: string; text: string }) {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], "billy-look.jpg", { type: blob.type || "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return "shared" as const;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled" as const;
    }
  }
  // Clipboard images must be PNG.
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  const png = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't copy the image."))), "image/png"),
  );
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
  return "copied" as const;
}
