"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CategoryRow, ShippingClassRow } from "@/db/schema";
import { deleteCategory, saveCategory } from "@/lib/actions/admin";
import { slugify } from "@/lib/admin-shared";
import { Button, Card, Field, inputCls } from "./ui";
import { SingleImage } from "./ImageUploader";
import { attrKey, FILTER_KEYS, FILTERS_V2, filterRules } from "@/lib/filter-attrs";
import { inheritedClass, ShippingClassSelect } from "./ShippingClassSelect";

type Cat = { id: number; name: string; parentId: number | null; shippingClassId: number | null };

export function CategoryForm({
  category,
  all,
  defaultParent,
  classes,
  attrOptions,
}: {
  category: CategoryRow | null;
  all: Cat[];
  defaultParent: number | null;
  classes: ShippingClassRow[];
  attrOptions: { label: string; count: number; auto: boolean }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [name, setName] = useState(category?.name ?? "");
  const [nameEn, setNameEn] = useState(category?.en?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [parentId, setParentId] = useState<number | null>(category?.parentId ?? defaultParent);
  const [image, setImage] = useState(category?.image ?? "");
  const [showOnHome, setShowOnHome] = useState(category?.showOnHome ?? false);
  const [showInMenu, setShowInMenu] = useState(category?.showInMenu ?? true);
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  // null = ავტომატური (ახლანდელი ნაგულისხმევი ფილტრები)
  const [filters, setFilters] = useState<string[] | null>(category?.filters ?? null);
  const rules = filterRules(filters);
  const autoOf = (key: string) => attrOptions.find((a) => attrKey(a.label) === key)?.auto ?? false;
  const filterOn = (key: string) => (key.startsWith("attr:") ? rules.attr(key.slice(5), autoOf(key)) : rules.show(key));
  const toggleFilter = (key: string, on: boolean) => {
    // ძველი ფორმატი → v2 (არჩევანი იგივე რჩება)
    let cur = filters;
    if (!cur || !cur.includes(FILTERS_V2)) {
      const r = filterRules(cur);
      const keys = [FILTER_KEYS.categories, FILTER_KEYS.price, FILTER_KEYS.brand, FILTER_KEYS.offers];
      cur = [FILTERS_V2];
      for (const k of keys) if (!r.show(k)) cur.push(`off:${k}`);
      for (const a of attrOptions) {
        const shown = r.attr(a.label, a.auto);
        if (a.auto && !shown) cur.push(`off:${attrKey(a.label)}`);
        if (!a.auto && shown) cur.push(`on:${attrKey(a.label)}`);
      }
    }
    const auto = key.startsWith("attr:") ? autoOf(key) : true;
    const marker = auto ? `off:${key}` : `on:${key}`;
    const shouldHave = auto ? !on : on;
    cur = cur.filter((k) => k !== marker);
    if (shouldHave) cur.push(marker);
    setFilters(cur);
  };
  const [shippingClassId, setShippingClassId] = useState<number | null>(category?.shippingClassId ?? null);

  // კატეგორია საკუთარ თავში ან ქვეკატეგორიაში ვერ გადავა
  const branch = new Set<number>(category ? [category.id] : []);
  for (let grew = branch.size > 0; grew; ) {
    grew = false;
    for (const c of all)
      if (c.parentId && branch.has(c.parentId) && !branch.has(c.id)) {
        branch.add(c.id);
        grew = true;
      }
  }
  const options: { id: number; label: string }[] = [];
  const walk = (pid: number | null, depth: number) =>
    all
      .filter((c) => c.parentId === pid && !branch.has(c.id) && depth < 2)
      .forEach((c) => {
        options.push({ id: c.id, label: `${"— ".repeat(depth)}${c.name}` });
        walk(c.id, depth + 1);
      });
  walk(null, 0);

  const save = () =>
    start(async () => {
      setMessage(null);
      const res = await saveCategory(category?.id ?? null, { name, slug, parentId, image: image || null, showOnHome, showInMenu, shippingClassId, sortOrder, filters, en: { name: nameEn } });
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: "შენახულია ✓" });
      if (!category) router.replace(`/admin/categories/${res.id}`);
      else router.refresh();
    });

  const remove = () => {
    if (!category || !confirm(`წაიშალოს „${category.name}“? პროდუქცია არ წაიშლება, მხოლოდ კატეგორია მოეხსნება.`)) return;
    start(async () => {
      const res = await deleteCategory(category.id);
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      router.replace("/admin/categories");
    });
  };

  return (
    <form
      className="grid lg:grid-cols-[1fr_320px] gap-5 items-start"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Card>
        <div className="grid gap-4">
          <Field label="დასახელება *">
            <input
              value={name}
              required
              onChange={(e) => {
                setName(e.target.value);
                if (!category) setSlug(slugify(e.target.value));
              }}
              className={inputCls}
            />
          </Field>
          <Field label="დასახელება (English)" hint="ინგლისურ ვერსიაზე; ცარიელი = ქართული ჩანს">
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputCls} lang="en" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="ბმული (slug)" hint="მისამართში: /products?category=…">
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} />
            </Field>
            <Field label="მშობელი">
              <select value={parentId ?? ""} onChange={(e) => setParentId(Number(e.target.value) || null)} className={inputCls}>
                <option value="">— მთავარი სექცია —</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="ლოჯისტიკური კლასი" hint="ვრცელდება ამ კატეგორიის ყველა ქვეკატეგორიასა და პროდუქტზე">
            <ShippingClassSelect
              value={shippingClassId}
              onChange={setShippingClassId}
              classes={classes}
              inherited={inheritedClass(all, parentId, classes)}
              inheritLabel="მშობლიდან"
            />
          </Field>
          <Field label="რიგითობა" hint="ნაკლები რიცხვი = უფრო წინ">
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={`${inputCls} max-w-32`} />
          </Field>
          <div>
            <span className="block text-sm font-semibold mb-1.5">სურათი</span>
            <SingleImage value={image} onChange={setImage} />
            <p className="text-xs text-slate-500 mt-2">რეკომენდებულია გამჭვირვალე ფონით (PNG/WEBP), პროდუქტის ფოტო.</p>
          </div>
          {category && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold mb-1">ფილტრები მაღაზიაში</h3>
              <p className="text-sm text-slate-500 mb-3">მონიშნეთ, რომელი ფილტრები გამოჩნდეს ამ კატეგორიაში. მახასიათებლები პროდუქტებიდან თავისით ივსება.</p>
              <div className="grid gap-2">
                {[
                  [FILTER_KEYS.categories, "კატეგორიები"],
              [FILTER_KEYS.price, "ფასი"],
                  [FILTER_KEYS.brand, "ბრენდი"],
                  [FILTER_KEYS.offers, "შეთავაზებები (ფასდაკლება, ახალი)"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input type="checkbox" checked={filterOn(key)} onChange={(e) => toggleFilter(key, e.target.checked)} className="h-4 w-4 accent-[#ff5a00]" />
                    {label}
                  </label>
                ))}
                {attrOptions.length > 0 && <div className="text-xs font-semibold text-slate-500 mt-2">მახასიათებლები</div>}
                {attrOptions.map((a) => (
                  <label key={a.label} className="flex items-center gap-2">
                    <input type="checkbox" checked={filterOn(attrKey(a.label))} onChange={(e) => toggleFilter(attrKey(a.label), e.target.checked)} className="h-4 w-4 accent-[#ff5a00]" />
                    {a.label} <span className="text-xs text-slate-400">({a.count} პროდუქტი)</span>
                  </label>
                ))}
                {attrOptions.length === 0 && <p className="text-xs text-slate-500">ამ კატეგორიის პროდუქტებს ფილტრისთვის გამოსადეგი მახასიათებლები ჯერ არ აქვს.</p>}
              </div>
              {filters && (
                <button type="button" onClick={() => setFilters(null)} className="mt-3 text-sm font-semibold text-[#ff5a00]">
                  დაბრუნება ავტომატურ რეჟიმზე
                </button>
              )}
              <p className="text-xs text-slate-500 mt-2">შეცვლის შემდეგ დააჭირეთ „შენახვა“.</p>
            </div>
          )}
        </div>
      </Card>
      <Card>
        <div className="grid gap-3">
          <Button disabled={pending}>{pending ? "ინახება…" : "შენახვა"}</Button>
          {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showOnHome} onChange={(e) => setShowOnHome(e.target.checked)} className="h-4 w-4 accent-[#ff5a00]" />
            მთავარ გვერდზე და მაღაზიის ზოლში
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showInMenu} onChange={(e) => setShowInMenu(e.target.checked)} className="h-4 w-4 accent-[#ff5a00]" />
            ჰედერის „კატეგორიების“ მენიუში
          </label>
          {category && (
            <>
              <Link href={`/admin/categories/new?parent=${category.id}`} className="text-center text-sm font-semibold text-[#ff5a00] py-2">
                + ქვეკატეგორიის დამატება
              </Link>
              <Link href={`/admin/products?cat=${category.id}`} className="text-center text-sm font-semibold text-[#ff5a00] py-2">
                ამ კატეგორიის პროდუქცია →
              </Link>
              <Button type="button" variant="danger" onClick={remove} disabled={pending}>
                კატეგორიის წაშლა
              </Button>
            </>
          )}
        </div>
      </Card>
    </form>
  );
}
