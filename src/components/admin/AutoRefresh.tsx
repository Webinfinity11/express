"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches the current admin page periodically so new orders show up without a reload. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
