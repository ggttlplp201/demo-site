"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/state/locale";

interface ModelViewerProps {
  src: string;
  alt: string;
}

export function ModelViewer({ src, alt }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  function handleReset() {
    const el = containerRef.current?.querySelector("model-viewer") as HTMLElement & {
      cameraOrbit: string;
      resetTurntableRotation?: () => void;
    } | null;
    if (el) {
      el.cameraOrbit = "0deg 75deg 105%";
    }
  }

  function handleFullscreen() {
    containerRef.current?.requestFullscreen?.();
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded border border-aluminium bg-gradient-to-b from-white to-neutral-fill overflow-hidden"
    >
      {/* @ts-expect-error custom element */}
      <model-viewer
        src={src}
        alt={alt}
        camera-controls
        auto-rotate
        shadow-intensity="1"
        touch-action="pan-y"
        style={{ width: "100%", height: "480px", display: "block" }}
      />
      {/* SAMPLE overlay — pointer-events-none so orbit/zoom/click pass through */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(to right, rgba(20,20,20,0.06) 0 14px, transparent 14px 28px)",
        }}
      >
        <span
          className="absolute top-2 left-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40 select-none"
        >
          {t("viewer.sample")}
        </span>
      </div>
      <div className="absolute bottom-3 right-3 flex gap-2 z-20">
        <button
          aria-label={t("viewer.reset")}
          onClick={handleReset}
          className="rounded border border-aluminium bg-white px-2.5 py-1 text-xs text-ink hover:bg-neutral-fill"
        >
          {t("viewer.reset")}
        </button>
        <button
          aria-label={t("viewer.fullscreen")}
          onClick={handleFullscreen}
          className="rounded border border-aluminium bg-white px-2.5 py-1 text-xs text-ink hover:bg-neutral-fill"
        >
          {t("viewer.fullscreen")}
        </button>
      </div>
    </div>
  );
}
