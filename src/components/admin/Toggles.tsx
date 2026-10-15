"use client";

import { useOptimistic, useTransition } from "react";
import { setProductFlag, setPromoActive } from "@/lib/actions/admin";

function Switch({ value, onToggle }: { value: boolean; onToggle: (next: boolean) => Promise<unknown> }) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          await onToggle(!optimistic);
        })
      }
      className={`relative inline-flex h-6 w-11 rounded-full transition ${optimistic ? "bg-green-500" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${optimistic ? "left-5.5" : "left-0.5"}`} />
    </button>
  );
}

export function FlagToggle({ id, flag, value }: { id: number; flag: "published" | "inStock" | "featured"; value: boolean }) {
  return <Switch value={value} onToggle={(v) => setProductFlag(id, flag, v)} />;
}

export function PromoToggle({ id, value }: { id: number; value: boolean }) {
  return <Switch value={value} onToggle={(v) => setPromoActive(id, v)} />;
}
