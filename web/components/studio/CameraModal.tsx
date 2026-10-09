"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "@phosphor-icons/react";

export function CameraModal({ onClose, onCapture }: { onClose: () => void; onCapture: (blob: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | undefined;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Billy couldn't open your camera. Check the browser's camera permission, or upload a photo instead."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      const video = videoRef.current;
      if (!video) return;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      // Mirror to match the preview the person was looking at.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => blob && onCapture(blob), "image/jpeg", 0.92);
      return;
    }
    const t = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onCapture]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0c0c0b]/65 p-4 backdrop-blur-sm" role="dialog" aria-modal aria-label="Take a photo">
      <div className="w-full max-w-lg overflow-hidden rounded-[20px] bg-surface shadow-lift">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="font-semibold">Take a photo</p>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-surface-2" aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className="relative aspect-[4/5] bg-surface-2">
          {error ? (
            <p className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-muted">{error}</p>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedData={() => setReady(true)}
              className="size-full -scale-x-100 object-cover"
            />
          )}
          {count !== null && count > 0 && (
            <span className="absolute inset-0 grid place-items-center text-8xl font-semibold text-white drop-shadow-lg">{count}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <p className="text-sm text-muted">Step back so your outfit is in frame. You get a 3 second countdown.</p>
          <button onClick={() => setCount(3)} disabled={!ready || count !== null} className="btn btn-primary shrink-0">
            <Camera size={16} weight="bold" />
            Capture
          </button>
        </div>
      </div>
    </div>
  );
}
