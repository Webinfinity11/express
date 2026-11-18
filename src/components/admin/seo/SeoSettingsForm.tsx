"use client";

import { useState, useTransition } from "react";
import { saveSeoSettings } from "@/lib/actions/seo";
import { SEO_TYPES, TEMPLATE_VARS, renderTemplate, type SeoSettings, type SeoType, type TypeMeta } from "@/lib/seo-shared";
import { Button, Card, Field, inputCls } from "../ui";
import { SingleImage } from "../ImageUploader";

const TYPE_LABELS: Record<SeoType, [string, string]> = {
  home: ["მთავარი გვერდი", "/"],
  shop: ["მაღაზია", "/products"],
  product: ["პროდუქტები", "/product/..."],
  category: ["კატეგორიები", "/products?category=..."],
  page: ["გვერდები", "/about-us, /delivery..."],
};

const SAMPLE = { title: "Bosch სარეცხი მანქანა WAN24", excerpt: "წინა ჩატვირთვის სარეცხი მანქანა 8 კგ...", category: "სარეცხი მანქანები", brand: "Bosch", price: "1299", sku: "WAN24", count: "42" };

export function SeoSettingsForm({ initial, section }: { initial: SeoSettings; section: "titles" | "sitemap" }) {
  const [s, setS] = useState(initial);
  const [tab, setTab] = useState<"global" | SeoType>("global");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof SeoSettings>(k: K, v: SeoSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const setType = (t: SeoType, patch: Partial<TypeMeta>) => setS((x) => ({ ...x, types: { ...x.types, [t]: { ...x.types[t], ...patch } } }));

  function save() {
    setMsg(null);
    start(async () => {
      const r = await saveSeoSettings(s);
      setMsg(r.ok ? { ok: true, text: "შენახულია ✓" } : { ok: false, text: r.error });
    });
  }

  const footer = (
    <div className="sticky bottom-0 z-10 -mx-1 mt-5 flex items-center gap-3 bg-slate-50/90 px-1 py-3 backdrop-blur">
      <Button onClick={save} disabled={pending}>
        {pending ? "ინახება…" : "ცვლილებების შენახვა"}
      </Button>
      {msg && <span className={`text-sm font-semibold ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
    </div>
  );

  if (section === "sitemap") {
    const sm = s.sitemap;
    const setSm = (patch: Partial<SeoSettings["sitemap"]>) => set("sitemap", { ...sm, ...patch });
    return (
      <>
        <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
          <div className="grid gap-5">
            <Card title="General">
              <div className="grid gap-3">
                <Check label="სურათები sitemap-ში" hint="პროდუქტის გალერეა (5-მდე) და კატეგორიის სურათი — Google Images-ისთვის" value={sm.images} onChange={(v) => setSm({ images: v })} />
                <Check label="მარაგში არარსებული პროდუქტების გამორიცხვა" value={sm.excludeOutOfStock} onChange={(v) => setSm({ excludeOutOfStock: v })} />
                <Field label="გამორიცხული ჩანაწერები" hint="პროდუქტის, კატეგორიის ან გვერდის slug — მძიმით ან თითო ხაზზე. noindex ჩანაწერები ავტომატურად გამოირიცხება.">
                  <textarea rows={4} value={sm.exclude} onChange={(e) => setSm({ exclude: e.target.value })} className={`${inputCls} font-mono text-sm`} placeholder="product-slug-1, category-slug" />
                </Field>
              </div>
            </Card>
            <Card title="ტიპები">
              <div className="grid gap-3">
                <Check label="პროდუქტები" value={sm.products} onChange={(v) => setSm({ products: v })} />
                <Check label="კატეგორიები" value={sm.categories} onChange={(v) => setSm({ categories: v })} />
                <Check label="გვერდები" value={sm.pages} onChange={(v) => setSm({ pages: v })} />
                <p className="text-xs text-slate-500">მთავარი, მაღაზია, „ჩვენ შესახებ“ და „კონტაქტი“ ყოველთვის შედის. თითო მისამართი ქართულ და ინგლისურ (hreflang) ვერსიებით.</p>
              </div>
            </Card>
            <Card title="robots.txt">
              <Field label="დამატებით აკრძალული მისამართები" hint="თითო ხაზზე, მაგ. /products?sale=1. /admin, /api, /cart, /checkout ყოველთვის აკრძალულია.">
                <textarea rows={4} value={s.robots.disallow} onChange={(e) => set("robots", { disallow: e.target.value })} className={`${inputCls} font-mono text-sm`} />
              </Field>
            </Card>
          </div>
          <Card title="ბმულები">
            <div className="grid gap-2 text-sm">
              <a href="/sitemap.xml" target="_blank" className="font-semibold text-[#ff5a00]">
                /sitemap.xml ↗
              </a>
              <a href="/robots.txt" target="_blank" className="font-semibold text-[#ff5a00]">
                /robots.txt ↗
              </a>
              <p className="text-slate-500 mt-2">
                Sitemap-ის მისამართი დაამატეთ Google Search Console-ში: <code className="text-xs bg-slate-100 rounded px-1">{s.siteUrl}/sitemap.xml</code>
              </p>
            </div>
          </Card>
        </div>
        {footer}
      </>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-[200px_1fr] gap-5 items-start">
        <nav className="bg-white rounded-xl border border-slate-200 p-2 grid gap-1 md:sticky md:top-4">
          {(["global", ...SEO_TYPES] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`text-left rounded-lg px-3 py-2 text-sm font-semibold ${tab === t ? "bg-orange-50 text-[#ff5a00]" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {t === "global" ? "Global Meta" : TYPE_LABELS[t][0]}
            </button>
          ))}
        </nav>

        {tab === "global" ? (
          <div className="grid gap-5">
            <Card title="Global Meta">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="საიტის სახელი" hint="%sitename%">
                  <input value={s.siteName} onChange={(e) => set("siteName", e.target.value)} className={inputCls} />
                </Field>
                <Field label="გამყოფი" hint="%sep%">
                  <div className="flex flex-wrap gap-1.5">
                    {["|", "-", "–", "—", "·", "•", "»", "/"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set("separator", c)}
                        className={`size-10 rounded-lg border font-bold ${s.separator === c ? "border-[#ff5a00] bg-orange-50 text-[#ff5a00]" : "border-slate-300 bg-white"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="საიტის მისამართი" hint="canonical, sitemap და Open Graph ბმულებისთვის">
                  <input value={s.siteUrl} onChange={(e) => set("siteUrl", e.target.value)} className={inputCls} placeholder="https://emix.ge" />
                </Field>
                <Field label="Twitter / X ანგარიში">
                  <input value={s.twitterHandle} onChange={(e) => set("twitterHandle", e.target.value)} className={inputCls} placeholder="@expressmix" />
                </Field>
              </div>
            </Card>
            <Card title="OpenGraph სურათი (ნაგულისხმევი)">
              <p className="text-sm text-slate-500 mb-3">გამოიყენება Facebook-ზე და სხვა სოციალურ ქსელებში გაზიარებისას, როცა გვერდს საკუთარი სურათი არ აქვს. რეკომენდებული ზომა: 1200×630.</p>
              <SingleImage value={s.defaultOgImage} onChange={(v) => set("defaultOgImage", v)} />
            </Card>
            <Card title="Webmaster Tools — საიტის დადასტურება">
              <div className="grid gap-4">
                <Field label="Google Search Console" hint='ჩასვით კოდი ან მთელი <meta name="google-site-verification" ...> ტეგი'>
                  <input value={s.verification.google} onChange={(e) => set("verification", { ...s.verification, google: e.target.value })} className={`${inputCls} font-mono text-sm`} />
                </Field>
                <Field label="Bing Webmaster Tools">
                  <input value={s.verification.bing} onChange={(e) => set("verification", { ...s.verification, bing: e.target.value })} className={`${inputCls} font-mono text-sm`} />
                </Field>
                <Field label="Yandex">
                  <input value={s.verification.yandex} onChange={(e) => set("verification", { ...s.verification, yandex: e.target.value })} className={`${inputCls} font-mono text-sm`} />
                </Field>
              </div>
            </Card>
          </div>
        ) : (
          <TypeCard key={tab} type={tab} meta={s.types[tab]} settings={s} onChange={(p) => setType(tab, p)} />
        )}
      </div>
      {footer}
    </>
  );
}

function TypeCard({ type, meta, settings, onChange }: { type: SeoType; meta: TypeMeta; settings: SeoSettings; onChange: (p: Partial<TypeMeta>) => void }) {
  const [lang, setLang] = useState<"ka" | "en">("ka");
  const en = lang === "en";
  const title = en ? meta.titleEn : meta.title;
  const desc = en ? meta.descriptionEn : meta.description;
  const previewTitle = renderTemplate((en && meta.titleEn) || meta.title, SAMPLE, settings);
  const previewDesc = renderTemplate((en && meta.descriptionEn) || meta.description, SAMPLE, settings);
  const [label, path] = TYPE_LABELS[type];
  return (
    <div className="grid gap-5">
      <Card
        title={label}
        actions={
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm font-semibold">
            {(["ka", "en"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} className={`rounded-md px-3 py-1 ${lang === l ? "bg-[#151515] text-white" : "text-slate-600"}`}>
                {l === "ka" ? "ქართული" : "English"}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-4">
          <Field label={`Title-ის შაბლონი${en ? " (ცარიელი = ქართული შაბლონი)" : ""}`}>
            <input value={title} onChange={(e) => onChange(en ? { titleEn: e.target.value } : { title: e.target.value })} className={`${inputCls} font-mono text-sm`} placeholder={en ? meta.title : ""} />
          </Field>
          <Field label={`Description-ის შაბლონი${en ? " (ცარიელი = ქართული შაბლონი)" : ""}`}>
            <textarea rows={3} value={desc} onChange={(e) => onChange(en ? { descriptionEn: e.target.value } : { description: e.target.value })} className={`${inputCls} font-mono text-sm`} placeholder={en ? meta.description : ""} />
          </Field>
          <Check
            label="Robots Meta: noindex"
            hint="ამ ტიპის ყველა გვერდი დაიმალება საძიებოებიდან და sitemap-იდან (ჩანაწერზე ცალკე შეიძლება შეიცვალოს)"
            value={meta.noindex}
            onChange={(v) => onChange({ noindex: v })}
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-500 mb-2">Google-ის შედეგის მაგალითი</div>
            <div className="text-xs text-slate-600">
              {settings.siteUrl.replace(/^https?:\/\//, "")} › {path}
            </div>
            <div className="text-[#1a0dab] text-lg leading-snug truncate">{previewTitle}</div>
            <div className="text-sm text-slate-600 line-clamp-2">{previewDesc}</div>
          </div>
        </div>
      </Card>
      <VarsLegend />
    </div>
  );
}

export function VarsLegend() {
  return (
    <Card title="ცვლადები">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        {TEMPLATE_VARS.map(([v, d]) => (
          <div key={v} className="flex gap-2">
            <code className="shrink-0 text-xs bg-slate-100 rounded px-1.5 py-0.5 text-[#ff5a00]">{v}</code>
            <span className="text-slate-600">{d}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Check({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-[#ff5a00]" />
      <span>
        <span className="block font-semibold text-sm">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}
