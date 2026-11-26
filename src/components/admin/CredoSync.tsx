"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { syncCredo } from "@/lib/actions/admin";

/** კრედოს callback არ აქვს — შეკვეთების გვერდის გახსნისას (და ყოველ წუთს) სტატუსებს თავად ვამოწმებთ */
export function CredoSync() {
  const router = useRouter();
  useEffect(() => {
    const run = () => {
      if (document.visibilityState !== "visible") return;
      syncCredo()
        .then((n) => n > 0 && router.refresh())
        .catch(() => {});
    };
    run();
    const t = setInterval(run, 60_000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
