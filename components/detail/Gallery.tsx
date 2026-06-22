"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useT } from "@/state/locale";

gsap.registerPlugin(useGSAP);

interface GalleryProps {
  images: string[];
  alt: string;
}

export function Gallery({ images, alt }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const t = useT();
  const dirRef = useRef(1);
  const mainImgWrapRef = useRef<HTMLDivElement>(null);

  const hasMultipleImages = images.length > 1;

  // GSAP crossfade+slide on main image when activeIndex changes
  useGSAP(
    () => {
      if (!mainImgWrapRef.current) return;
      const reduced =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.fromTo(
        mainImgWrapRef.current,
        { autoAlpha: 0, x: dirRef.current * 16 },
        { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }
      );
    },
    { dependencies: [activeIndex], scope: mainImgWrapRef }
  );

  function handlePrev() {
    dirRef.current = -1;
    setActiveIndex(i => (i - 1 + images.length) % images.length);
  }

  function handleNext() {
    dirRef.current = 1;
    setActiveIndex(i => (i + 1) % images.length);
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center rounded border border-aluminium bg-neutral-fill" style={{ height: "480px" }}>
        <span className="text-aluminium-dark text-sm">{alt}</span>
      </div>
    );
  }

  const mainSrc = images[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      {/* Main image with arrows */}
      <div className="relative rounded border border-aluminium bg-neutral-fill overflow-hidden" style={{ height: "480px" }}>
        <div ref={mainImgWrapRef} className="absolute inset-0">
          <Image
            src={mainSrc}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </div>
        {hasMultipleImages && (
          <>
            <button
              type="button"
              aria-label={t("card.prevImage")}
              onClick={handlePrev}
              className="absolute inset-y-0 left-2 my-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              aria-label={t("card.nextImage")}
              onClick={handleNext}
              className="absolute inset-y-0 right-2 my-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => {
                dirRef.current = i > activeIndex ? 1 : -1;
                setActiveIndex(i);
              }}
              className={`relative shrink-0 rounded border overflow-hidden ${
                i === activeIndex ? "border-brand" : "border-aluminium"
              }`}
              style={{ width: 72, height: 72 }}
              aria-label={`Imagem ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
