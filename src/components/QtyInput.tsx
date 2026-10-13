"use client";

import { useState } from "react";
import { MAX_QTY } from "@/context/StoreContext";
import { Icon } from "./Icon";

export function QtyInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  // ტექსტური ველი იცვლება თავისუფლად, მნიშვნელობა მტკიცდება blur/Enter-ზე
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = Math.trunc(Number(draft));
    onChange(Number.isFinite(n) && n > 0 ? Math.min(MAX_QTY, n) : 1);
    setDraft(null);
  };

  return (
    <div className="quantity-input">
      <button aria-label="რაოდენობის შემცირება" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Icon name="minus" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_QTY}
        step={1}
        value={draft ?? value}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
      />
      <button aria-label="რაოდენობის გაზრდა" disabled={value >= MAX_QTY} onClick={() => onChange(value + 1)}>
        <Icon name="plus" />
      </button>
    </div>
  );
}
