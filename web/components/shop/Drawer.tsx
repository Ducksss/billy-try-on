"use client";

import { useEffect, useRef } from "react";

// Right-hand sheet used for the try-on and the bag. Full width on phones.
export function Drawer({
  label,
  onClose,
  children,
  className = "",
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label={label}>
      <div className="absolute inset-0 animate-[shop-fade_0.25s_ease-out] bg-black/30" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full animate-[shop-slide_0.35s_cubic-bezier(0.16,1,0.3,1)] flex-col bg-white outline-none sm:w-[28rem] motion-reduce:animate-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
