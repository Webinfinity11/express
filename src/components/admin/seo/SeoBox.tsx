"use client";

import { useState, useTransition } from "react";
import type { EntitySeo } from "@/db/schema";
import { saveEntitySeo, type SeoKind } from "@/lib/actions/seo";
import { Button, Card, inputCls } from "../ui";
import { SingleImage } from "../ImageUploader";

type Defaults = { ka: { title: string; description: string }; en: { title: string; description: string } };

/** ჩანაწერის SEO (Rank Math-ის მეტაბოქსის მსგავსი): ცარიელი ველი = Titles & Meta შაბლონი */
export function SeoBox({
  kind,
  id,
  initial,
  defaults,
  url,
  slug,
}: {
  kind: SeoKind;
  id: number;
  initial: EntitySeo;
  /** შაბლონიდან მიღებული title/description — placeholder-ად და preview-სთვის */
  defaults: Defaults;
  /** სრული მისამართი preview-სთვის */
  url: string;
  slug: string;
}) {
  const [seo, setSeo] = useState<EntitySeo>(initial);
  const [lang, setLang] = useState<"ka" | "en">("ka");
  const [tab, setTab] = useState<"general" | "advanced" | "social">("general");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const en = lang === "en";
  const title = (en ? seo.en?.title : seo.title) ?? "";
  const description = (en ? seo.en?.description : seo.description) ?? "";
  const setText = (k: "title" | "description", v: string) =>
    setSeo((s) => (en ? { ...s, en: { ...s.en, [k]: v } } : { ...s, [k]: v }));

  // EN ცარიელი → ქართული ჩანაწერის ველი → შაბლონი
  const effTitle = title || (en ? seo.title || defaults.en.title : defaults.ka.title);
  const effDesc = description || (en ? seo.description || defaults.en.description : defaults.ka.description);

  function save() {
    setMsg(null);
    start(async () => {
      const r = await saveEntitySeo(kind, id, seo);
      setMsg(r.ok ? { ok: true, text: "SEO შენახულია ✓" } : { ok: false, text: r.error });
    });
  }

  const kw = (seo.focusKeyword ?? "").trim().toLowerCase();
  const checks: [boolean, string][] = [
    [effTitle.length >= 30 && effTitle.length <= 60, `Title-ის სიგრძე ${effTitle.length} (რეკომენდებული 30–60)`],
    [effDesc.length >= 100 && effDesc.length <= 160, `Description-ის სიგრძე ${effDesc.length} (რეკომენდებული 100–160)`],
    ...(kw
      ? ([
          [effTitle.toLowerCase().includes(kw), "Focus keyword არის Title-ში"],
          [effDesc.toLowerCase().includes(kw), "Focus keyword არის Description-ში"],
          [decodeURIComponent(slug).toLowerCase().includes(kw.replace(/\s+/g, "-")), "Focus keyword არის URL-ში"],
          [effTitle.toLowerCase().startsWith(kw), "Focus keyword Title-ის დასაწყისშია"],
        ] as [boolean, string][])
      : []),
  ];
  const score = Math.round((checks.filter((c) => c[0]).length / checks.length) * 100);

  return (
    <Card
      title="SEO"
      actions={
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${score >= 80 ? "bg-green-100 text-green-800" : score >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}>
            {score} / 100
          </span>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm font-semibold">
            {(["ka", "en"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} className={`rounded-md px-3 py-1 ${lang === l ? "bg-[#151515] text-white" : "text-slate-600"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="rounded-lg border border-slate-200 bg-white p-4 mb-4 shadow-sm">
        <div className="text-xs text-slate-600 truncate">{(en ? url.replace(/(https?:\/\/[^/]+)/, "$1/en") : url).replace(/^https?:\/\//, "").replace(/\//g, " › ")}</div>
        <div className="text-[#1a0dab] text-lg leading-snug truncate">{effTitle}</div>
        <div className="text-sm text-slate-600 line-clamp-2">{effDesc}</div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 text-sm font-semibold">
        {(
          [
            ["general", "General"],
            ["advanced", "Advanced"],
            ["social", "Social"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-2 -mb-px border-b-2 ${tab === k ? "border-[#ff5a00] text-[#ff5a00]" : "border-transparent text-slate-500"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="grid gap-4">
          <Counter label="SEO Title" value={title} max={60} placeholder={en ? seo.title || defaults.en.title : defaults.ka.title} onChange={(v) => setText("title", v)} />
          <Counter label="Meta Description" value={description} max={160} placeholder={en ? seo.description || defaults.en.description : defaults.ka.description} onChange={(v) => setText("description", v)} multiline />
          <label className="block">
            <span className="block text-sm font-semibold mb-1.5">Focus Keyword</span>
            <input value={seo.focusKeyword ?? ""} onChange={(e) => setSeo({ ...seo, focusKeyword: e.target.value })} className={inputCls} placeholder="მაგ. სარეცხი მანქანა" />
          </label>
          <ul className="grid gap-1 text-sm">
            {checks.map(([ok, text]) => (
              <li key={text} className="flex gap-2">
                <span className={ok ? "text-green-600" : "text-red-500"}>{ok ? "✓" : "✕"}</span>
                <span className="text-slate-600">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "advanced" && (
        <div className="grid gap-4">
          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={!!seo.noindex} onChange={(e) => setSeo({ ...seo, noindex: e.target.checked })} className="mt-0.5 size-4 accent-[#ff5a00]" />
            <span>
              <span className="block text-sm font-semibold">No Index</span>
              <span className="block text-xs text-slate-500">საძიებოებში არ გამოჩნდება და sitemap-იდან ამოვარდება</span>
            </span>
          </label>
          <label className="block">
            <span className="block text-sm font-semibold mb-1.5">Canonical URL</span>
            <input value={seo.canonical ?? ""} onChange={(e) => setSeo({ ...seo, canonical: e.target.value })} className={`${inputCls} font-mono text-sm`} placeholder={url} />
            <span className="block text-xs text-slate-500 mt-1">ცარიელი = ამ გვერდის საკუთარი მისამართი</span>
          </label>
        </div>
      )}

      {tab === "social" && (
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Facebook / OpenGraph სურათი</span>
          <span className="text-xs text-slate-500">ცარიელი = მთავარი სურათი. რეკომენდებული ზომა 1200×630.</span>
          <SingleImage value={seo.ogImage} onChange={(v) => setSeo({ ...seo, ogImage: v })} />
        </div>
      )}

      <div className="flex items-center gap-3 mt-5">
        <Button onClick={save} disabled={pending}>
          {pending ? "ინახება…" : "SEO-ს შენახვა"}
        </Button>
        {msg && <span className={`text-sm font-semibold ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>
    </Card>
  );
}

function Counter({ label, value, max, placeholder, onChange, multiline }: { label: string; value: string; max: number; placeholder: string; onChange: (v: string) => void; multiline?: boolean }) {
  const n = (value || placeholder).length;
  const pct = Math.min(100, (n / max) * 100);
  const color = n > max ? "bg-red-500" : n >= max * 0.5 ? "bg-green-500" : "bg-amber-400";
  return (
    <label className="block">
      <span className="flex justify-between text-sm font-semibold mb-1.5">
        {label}
        <span className={`font-normal ${n > max ? "text-red-600" : "text-slate-500"}`}>
          {n} / {max}
        </span>
      </span>
      {multiline ? (
        <textarea rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
      <span className="block h-1 mt-1.5 rounded bg-slate-200 overflow-hidden">
        <span className={`block h-full ${color}`} style={{ width: `${pct}%` }} />
      </span>
    </label>
  );
}
