"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PageRow } from "@/db/schema";
import { deletePage, savePage } from "@/lib/actions/admin";
import { slugify } from "@/lib/admin-shared";
import type { LinkOption } from "@/lib/site-links";
import { Button, Card, Field, inputCls } from "./ui";
import { SingleImage } from "./ImageUploader";
import { LinkField } from "./LinkField";

export function PageForm({ page, links }: { page: PageRow | null; links: LinkOption[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [v, setV] = useState({
    title: page?.title ?? "",
    slug: page?.slug ?? "",
    eyebrow: page?.eyebrow ?? "",
    subtitle: page?.subtitle ?? "",
    image: page?.image ?? "",
    body: page?.body ?? "",
    buttonText: page?.buttonText ?? "",
    buttonHref: page?.buttonHref ?? "",
    metaDescription: page?.metaDescription ?? "",
    published: page?.published ?? true,
  });
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((cur) => ({ ...cur, [k]: val }));

  const save = () =>
    start(async () => {
      setMessage(null);
      const res = await savePage(page?.id ?? null, v);
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: "შენახულია ✓ საიტზე უკვე ჩანს." });
      if (!page) router.replace(`/admin/pages/${res.id}`);
      else router.refresh();
    });

  const remove = () => {
    if (!page || !confirm(`წაიშალოს გვერდი „${page.title}“? მასზე მიმავალი ბმულები (მენიუ, ფუტერი) ხელით მოაშორეთ.`)) return;
    start(async () => {
      await deletePage(page.id);
      router.replace("/admin/pages");
    });
  };

  return (
    <form
      className="grid lg:grid-cols-[1fr_300px] gap-5 items-start"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="grid gap-5">
        <Card>
          <div className="grid gap-4">
            <Field label="სათაური *">
              <input
                value={v.title}
                required
                onChange={(e) => {
                  set("title", e.target.value);
                  if (!page) set("slug", slugify(e.target.value));
                }}
                className={inputCls}
              />
            </Field>
            <Field label="მისამართი" hint={`საიტზე: /${v.slug || "…"}`}>
              <input value={v.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="ზედა წარწერა" hint="მაგ. EXPRESS MIX">
                <input value={v.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} className={inputCls} />
              </Field>
              <Field label="ქვესათაური">
                <input value={v.subtitle} onChange={(e) => set("subtitle", e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div>
              <span className="block text-sm font-semibold mb-1.5">ბანერის სურათი</span>
              <SingleImage value={v.image} onChange={(url) => set("image", url)} />
            </div>
          </div>
        </Card>
        <Card title="ტექსტი">
          <textarea value={v.body} onChange={(e) => set("body", e.target.value)} rows={16} className={`${inputCls} font-mono text-sm`} />
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            აბზაცები გამოყავით ცარიელი ხაზით. <b>## </b>ხაზის დასაწყისში = ქვესათაური, <b>- </b>= სიის პუნქტი.
          </p>
        </Card>
        <Card title="ღილაკი (არასავალდებულო)">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="ღილაკის ტექსტი">
              <input value={v.buttonText} onChange={(e) => set("buttonText", e.target.value)} className={inputCls} />
            </Field>
            <div>
              <span className="block text-sm font-semibold mb-1.5">ბმული</span>
              <LinkField value={v.buttonHref} onChange={(h) => set("buttonHref", h)} options={links} />
            </div>
          </div>
        </Card>
        <Card title="Google-ისთვის">
          <Field label="მოკლე აღწერა" hint="ჩანს ძიების შედეგებში (150–160 სიმბოლო)">
            <textarea value={v.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={2} className={inputCls} />
          </Field>
        </Card>
      </div>
      <div className="lg:sticky lg:top-6">
        <Card>
          <div className="grid gap-3">
            <Button disabled={pending}>{pending ? "ინახება…" : "შენახვა"}</Button>
            {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={v.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 accent-[#ff5a00]" />
              გამოქვეყნებულია
            </label>
            <p className="text-xs text-slate-500">
              მენიუში ან ფუტერში დასამატებლად: „ჰედერი“ / „ფუტერი“ → ბმულები → „აირჩიეთ გვერდი სიიდან“.
            </p>
            {page && (
              <Button type="button" variant="danger" onClick={remove} disabled={pending}>
                გვერდის წაშლა
              </Button>
            )}
          </div>
        </Card>
      </div>
    </form>
  );
}
