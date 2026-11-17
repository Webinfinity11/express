"use client";

import { useEffect } from "react";

const BLOB = /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//;

/**
 * გვერდზე სურათები უცვლელია. მარჯვენა ღილაკზე / გადათრევაზე (ე.ი. გადმოწერისას)
 * სურათი წამით იცვლება ვატერმარკიანი ვერსიით /api/wm-დან, ამიტომ ფაილი ლოგოთი შეინახება.
 */
export function ImageWatermark() {
  useEffect(() => {
    const swap = (e: Event) => {
      const img = e.target instanceof HTMLImageElement ? e.target : null;
      if (!img || img.dataset.wmOrig) return;
      const src = img.currentSrc || img.src;
      if (!BLOB.test(src)) return;
      img.dataset.wmOrig = src;
      img.removeAttribute("srcset");
      img.src = `/api/wm?u=${encodeURIComponent(src)}`;
      setTimeout(() => {
        const orig = img.dataset.wmOrig;
        delete img.dataset.wmOrig;
        if (orig) img.src = orig;
      }, 1500);
    };
    const down = (e: PointerEvent) => {
      if (e.button === 2) swap(e);
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("contextmenu", swap, true);
    document.addEventListener("dragstart", swap, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("contextmenu", swap, true);
      document.removeEventListener("dragstart", swap, true);
    };
  }, []);
  return null;
}
