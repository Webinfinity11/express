"use client";

import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/data";
import { useT } from "@/i18n/client";

type Props = { min: number; max: number; lo: number; hi: number; onCommit: (lo: number, hi: number) => void };

// ორმაგი ფასის სლაიდერი + ჩასაწერი ველები. გადათრევისას მუშაობს ლოკალურ მდგომარეობაზე,
// URL-ში (ფილტრში) იწერება მხოლოდ მაუსის/თითის აშვებისას ან ველის დასრულებისას.
export function PriceFilter({ min, max, lo, hi, onCommit }: Props) {
  const t = useT();
  const [draft, setDraft] = useState<[number, number]>([lo, hi]);
  const [text, setText] = useState<[string, string]>([String(lo), String(hi)]);
  const dragging = useRef<null | 0 | 1>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const live = useRef(draft);
  live.current = draft;

  // URL-იდან მოსული ცვლილება (გასუფთავება, ჩიპი, უკან ღილაკი) — მხოლოდ გადათრევის გარეშე
  useEffect(() => {
    if (dragging.current === null) {
      setDraft([lo, hi]);
      setText([String(lo), String(hi)]);
    }
  }, [lo, hi]);

  const span = Math.max(1, max - min);
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const pct = (v: number) => ((v - min) / span) * 100;
  const snap = (v: number) => clamp(Math.round(v));

  const set = (next: [number, number]) => {
    setDraft(next);
    setText([String(next[0]), String(next[1])]);
  };

  const valueAt = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    return snap(min + ((clientX - r.left) / Math.max(1, r.width)) * span);
  };

  const move = (which: 0 | 1, v: number) => {
    const [a, b] = live.current;
    set(which === 0 ? [Math.min(v, b), b] : [a, Math.max(v, a)]);
  };

  const startDrag = (which: 0 | 1) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = which;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).focus();
  };
  const onMove = (e: React.PointerEvent) => {
    if (dragging.current !== null) move(dragging.current, valueAt(e.clientX));
  };
  const endDrag = () => {
    if (dragging.current === null) return;
    dragging.current = null;
    onCommit(live.current[0], live.current[1]);
  };

  // დაწკაპუნება ზოლზე — უახლოესი სახელური გადადის იქ
  const onTrack = (e: React.PointerEvent) => {
    const v = valueAt(e.clientX);
    const which: 0 | 1 = Math.abs(v - live.current[0]) <= Math.abs(v - live.current[1]) && v <= live.current[1] ? 0 : 1;
    move(which, v);
    dragging.current = which;
    const thumb = trackRef.current!.querySelectorAll<HTMLElement>("[role=slider]")[which];
    thumb.setPointerCapture(e.pointerId);
    thumb.focus();
  };

  const onKey = (which: 0 | 1) => (e: React.KeyboardEvent) => {
    const step = Math.max(1, Math.round(span / 50));
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? step : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -step : e.key === "PageUp" ? step * 5 : e.key === "PageDown" ? -step * 5 : 0;
    if (!d) return;
    e.preventDefault();
    move(which, snap(live.current[which] + d));
    onCommit(live.current[0], live.current[1]);
  };

  const commitText = (which: 0 | 1) => {
    const n = Number(text[which].replace(",", "."));
    const [a, b] = live.current;
    if (!Number.isFinite(n) || text[which].trim() === "") {
      setText([String(a), String(b)]);
      return;
    }
    const v = snap(n);
    const next: [number, number] = which === 0 ? [Math.min(v, b), b] : [a, Math.max(v, a)];
    set(next);
    onCommit(next[0], next[1]);
  };

  const field = (which: 0 | 1, label: string) => (
    <label>
      <input
        type="text"
        inputMode="numeric"
        value={text[which]}
        aria-label={label}
        onChange={(e) => setText((p) => (which === 0 ? [e.target.value.replace(/[^\d.,]/g, ""), p[1]] : [p[0], e.target.value.replace(/[^\d.,]/g, "")]))}
        onBlur={() => commitText(which)}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
      />
      <span>₾</span>
    </label>
  );

  return (
    <>
      <div className="price-fields">
        {field(0, t("მინიმალური ფასი"))}
        {field(1, t("მაქსიმალური ფასი"))}
      </div>
      <div className="price-slider" ref={trackRef} onPointerDown={onTrack} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="price-slider-fill" style={{ left: `${pct(draft[0])}%`, right: `${100 - pct(draft[1])}%` }} />
        {([0, 1] as const).map((w) => (
          <div
            key={w}
            className="price-thumb"
            role="slider"
            tabIndex={0}
            aria-label={w === 0 ? t("მინიმალური ფასი") : t("მაქსიმალური ფასი")}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={draft[w]}
            style={{ left: `${pct(draft[w])}%`, zIndex: w === 0 && draft[0] >= max - span * 0.1 ? 3 : 2 }}
            onPointerDown={startDrag(w)}
            onKeyDown={onKey(w)}
          />
        ))}
      </div>
      <div className="price-range-labels">
        <span>{money(min)} ₾</span>
        <span>{money(max)} ₾</span>
      </div>
    </>
  );
}
