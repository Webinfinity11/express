"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ProductRow, ShippingClassRow, Spec, VariantRow } from "@/db/schema";
import { deleteProduct, saveProduct } from "@/lib/actions/admin";
import { slugify } from "@/lib/admin-shared";
import type { AttrSuggestions } from "@/lib/attribute-suggestions";
import { Button, Card, Field, inputCls } from "./ui";
import { ImageUploader, SingleImage } from "./ImageUploader";
import { inheritedClass, ShippingClassSelect } from "./ShippingClassSelect";

type Cat = { id: number; name: string; parentId: number | null; shippingClassId: number | null };
type VariantDraft = {
  id: number | null;
  name: string;
  colorHex: string;
  sku: string;
  price: string;
  oldPrice: string;
  image: string;
  inStock: boolean;
  stockQty: string;
};

const str = (v: number | null | undefined) => (v == null ? "" : String(v));
const toDraft = (v: VariantRow): VariantDraft => ({
  id: v.id,
  name: v.name,
  colorHex: v.colorHex ?? "",
  sku: v.sku,
  price: str(v.price),
  oldPrice: str(v.oldPrice),
  image: v.image ?? "",
  inStock: v.inStock,
  stockQty: str(v.stockQty),
});

export function ProductForm({
  product,
  variants: initialVariants,
  categories,
  brands,
  classes,
  suggestions,
}: {
  product: ProductRow | null;
  variants: VariantRow[];
  categories: Cat[];
  brands: string[];
  classes: ShippingClassRow[];
  suggestions: AttrSuggestions;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [label, setLabel] = useState(product?.label ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(product?.categoryId ?? null);
  const [shippingClassId, setShippingClassId] = useState<number | null>(product?.shippingClassId ?? null);
  const [price, setPrice] = useState(str(product?.price));
  const [oldPrice, setOldPrice] = useState(str(product?.oldPrice));
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [sceneImage, setSceneImage] = useState(product?.sceneImage ?? "");
  const [subtitle, setSubtitle] = useState(product?.subtitle ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [specs, setSpecs] = useState<Spec[]>(product?.specs ?? []);
  // არჩეული კატეგორიის (ან უახლოესი მშობლის) პროდუქტებში გამოყენებული ველები
  let catSpecs: string[] = [];
  for (let c = categoryId; c && !catSpecs.length; c = categories.find((x) => x.id === c)?.parentId ?? null)
    catSpecs = suggestions.categorySpecs[c] ?? [];
  const fillCatSpecs = () => {
    const have = new Set(specs.map((s) => s.label.trim()));
    setSpecs([...specs.filter((s) => s.label.trim() || s.value.trim()), ...catSpecs.filter((l) => !have.has(l)).map((label) => ({ label, value: "" }))]);
  };
  const [dragSpec, setDragSpec] = useState<number | null>(null);
  // მახასიათებლის გადატანა from → to პოზიციაზე (ისრებით ან გადათრევით)
  const moveSpec = (from: number, to: number) => {
    if (to < 0 || to >= specs.length || from === to) return;
    const next = [...specs];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setSpecs(next);
  };
  const [keywords, setKeywords] = useState(product?.keywords ?? "");
  const [colorName, setColorName] = useState(product?.colorName ?? "");
  const [colorHex, setColorHex] = useState(product?.colorHex ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [published, setPublished] = useState(product?.published ?? true);
  const [inStock, setInStock] = useState(product?.inStock ?? true);
  const [stockQty, setStockQty] = useState(str(product?.stockQty));
  const [variants, setVariants] = useState<VariantDraft[]>(initialVariants.map(toDraft));
  const tracked = stockQty.trim() !== "";

  const setVariant = (i: number, patch: Partial<VariantDraft>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const addVariant = () =>
    setVariants((vs) => [...vs, { id: null, name: "", colorHex: "#151515", sku: "", price: "", oldPrice: "", image: "", inStock: true, stockQty: "" }]);

  const submit = () =>
    start(async () => {
      setMessage(null);
      const res = await saveProduct(product?.id ?? null, {
        name,
        slug,
        sku,
        label,
        brand,
        categoryId,
        shippingClassId,
        price: price || 0,
        oldPrice: oldPrice || null,
        images,
        sceneImage: sceneImage || null,
        subtitle,
        description,
        specs,
        keywords,
        colorName,
        colorHex: colorHex || null,
        featured,
        isNew,
        published,
        inStock,
        stockQty: tracked ? stockQty : null,
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name,
          colorHex: v.colorHex || null,
          sku: v.sku,
          price: v.price || null,
          oldPrice: v.oldPrice || null,
          image: v.image || null,
          inStock: v.inStock,
          stockQty: v.stockQty.trim() ? v.stockQty : null,
        })),
      });
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: "შენახულია ✓ საიტზე უკვე ჩანს." });
      if (!product) router.replace(`/admin/products/${res.id}`);
      else router.refresh();
    });

  const remove = () => {
    if (!product || !confirm(`წაიშალოს „${product.name}“? ამის დაბრუნება შეუძლებელია.`)) return;
    start(async () => {
      await deleteProduct(product.id);
      router.replace("/admin/products");
    });
  };

  const options: { id: number; label: string }[] = [];
  const walk = (pid: number | null, depth: number) =>
    categories
      .filter((c) => c.parentId === pid)
      .forEach((c) => {
        options.push({ id: c.id, label: `${"— ".repeat(depth)}${c.name}` });
        walk(c.id, depth + 1);
      });
  walk(null, 0);

  return (
    <form
      className="grid lg:grid-cols-[1fr_320px] gap-5 items-start"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-5 min-w-0">
        <Card>
          <div className="grid gap-4">
            <Field label="დასახელება *">
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!product) setSlug(slugify(e.target.value));
                }}
                required
                className={inputCls}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="ტიპი (მოკლედ)" hint="მაგ. ორთქლის უთო">
                <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
              </Field>
              <Field label="ბრენდი">
                <input value={brand} onChange={(e) => setBrand(e.target.value)} list="brand-list" className={inputCls} />
                <datalist id="brand-list">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Field>
              <Field label="კოდი (SKU)">
                <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputCls} />
              </Field>
              <Field label="ბმული (slug)" hint="ავტომატურად იქმნება სახელიდან">
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="სურათები">
          <ImageUploader value={images} onChange={setImages} />
          <p className="text-xs text-slate-500 mt-2">პირველი სურათი ჩანს ბარათზე. რეკომენდებულია თეთრ ფონზე, კვადრატული.</p>
          <div className="mt-5">
            <span className="block text-sm font-semibold mb-1.5">ინტერიერის ფოტო („აღწერის“ ტაბში)</span>
            <SingleImage value={sceneImage} onChange={setSceneImage} />
          </div>
        </Card>

        <Card
          title={`ვარიაციები / ფერები (${variants.length})`}
          actions={
            <Button type="button" variant="secondary" onClick={addVariant}>
              + ვარიაცია
            </Button>
          }
        >
          {variants.length === 0 ? (
            <p className="text-sm text-slate-500">
              თუ პროდუქტი რამდენიმე ფერში ან ზომაშია, დაამატეთ ვარიაციები. ფასი ან სურათი ცარიელი = პროდუქტის ფასი/სურათი.
            </p>
          ) : (
            <div className="grid gap-3">
              {variants.map((v, i) => (
                <div key={v.id ?? `new-${i}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 grid gap-3">
                  <div className="grid sm:grid-cols-[1fr_150px_1fr] gap-3">
                    <Field label="სახელი *" hint="მაგ. შავი, თეთრი, 7 კგ">
                      <input
                        value={v.name}
                        onChange={(e) => {
                          // ნაცნობი ფერის არჩევისას ფერის კოდიც ივსება
                          const known = suggestions.colors.find((c) => c.name === e.target.value);
                          setVariant(i, known?.hex && !v.colorHex ? { name: e.target.value, colorHex: known.hex } : { name: e.target.value });
                        }}
                        list="color-list"
                        required
                        className={inputCls}
                      />
                    </Field>
                    <Field label="ფერი">
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={v.colorHex || "#151515"}
                          onChange={(e) => setVariant(i, { colorHex: e.target.value })}
                          disabled={!v.colorHex}
                          className="h-10 w-12 rounded border border-slate-300 bg-white disabled:opacity-30"
                        />
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={!!v.colorHex}
                            onChange={(e) => setVariant(i, { colorHex: e.target.checked ? "#151515" : "" })}
                            className="accent-[#ff5a00]"
                          />
                          ფერი
                        </label>
                      </div>
                    </Field>
                    <Field label="კოდი (SKU)">
                      <input value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} className={inputCls} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="ფასი ₾">
                      <input type="number" step="0.01" min="0" placeholder={price} value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="ძველი ფასი ₾">
                      <input type="number" step="0.01" min="0" value={v.oldPrice} onChange={(e) => setVariant(i, { oldPrice: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="მარაგი (ც.)">
                      <input type="number" step="1" min="0" placeholder="არ ითვლება" value={v.stockQty} onChange={(e) => setVariant(i, { stockQty: e.target.value })} className={inputCls} />
                    </Field>
                    <label className="flex items-center gap-2 text-sm pt-6">
                      <input
                        type="checkbox"
                        checked={v.stockQty.trim() ? Number(v.stockQty) > 0 : v.inStock}
                        disabled={!!v.stockQty.trim()}
                        onChange={(e) => setVariant(i, { inStock: e.target.checked })}
                        className="h-4 w-4 accent-[#ff5a00]"
                      />
                      მარაგშია
                    </label>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="w-full sm:w-auto">
                      <span className="block text-sm font-semibold mb-1.5">ვარიაციის სურათი</span>
                      <SingleImage value={v.image} onChange={(url) => setVariant(i, { image: url })} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={i === 0}
                        onClick={() => setVariants((vs) => vs.map((x, j) => (j === i - 1 ? vs[i] : j === i ? vs[i - 1] : x)))}
                        aria-label="ზემოთ"
                      >
                        ↑
                      </Button>
                      <Button type="button" variant="danger" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}>
                        წაშლა
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="აღწერა">
          <div className="grid gap-4">
            <Field label="ქვესათაური" hint="მაგ. „იდეალური ზრუნვა ყველა დეტალზე.“ — წერტილის შემდეგ ნაწილი ნარინჯისფრად ჩანს">
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputCls} />
            </Field>
            <Field label="აღწერა">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className={inputCls} />
            </Field>
            <Field label="საძიებო სიტყვები" hint="სხვა დასახელებები, რუსულად/ინგლისურად — ძიებისთვის">
              <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card
          title="მახასიათებლები"
          actions={
            <div className="flex gap-2">
              {catSpecs.length > 0 && (
                <Button type="button" variant="secondary" onClick={fillCatSpecs} title="ამ კატეგორიის სხვა პროდუქტებში გამოყენებული ველები">
                  კატეგორიის ველები
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={() => setSpecs([...specs, { label: "", value: "" }])}>
                + დამატება
              </Button>
            </div>
          }
        >
          {specs.length === 0 && <p className="text-slate-500 text-sm">მაგ. სიმძლავრე, მოცულობა, ზომა, წონა.</p>}
          {specs.length > 1 && <p className="text-slate-500 text-xs mb-2">რიგითობის შესაცვლელად გადაათრიეთ ⠿-ით ან გამოიყენეთ ▲▼. შემდეგ დააჭირეთ „შენახვას“.</p>}
          <div className="grid gap-2">
            {specs.map((s, i) => (
              <div
                key={i}
                className={`flex gap-2 items-center rounded-lg ${dragSpec === i ? "opacity-50 bg-orange-50" : ""}`}
                onDragOver={(e) => {
                  if (dragSpec === null) return;
                  e.preventDefault();
                  if (dragSpec !== i) {
                    moveSpec(dragSpec, i);
                    setDragSpec(i);
                  }
                }}
                onDrop={(e) => e.preventDefault()}
              >
                <span
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    setDragSpec(i);
                  }}
                  onDragEnd={() => setDragSpec(null)}
                  className="cursor-grab active:cursor-grabbing select-none text-slate-400 hover:text-slate-700 px-1 text-lg leading-none"
                  title="გადაათრიეთ"
                  aria-hidden="true"
                >
                  ⠿
                </span>
                <div className="flex flex-col">
                  <button type="button" onClick={() => moveSpec(i, i - 1)} disabled={i === 0} className="text-slate-500 hover:text-[#ff5a00] disabled:opacity-25 px-1 text-xs leading-4" aria-label="ზემოთ">
                    ▲
                  </button>
                  <button type="button" onClick={() => moveSpec(i, i + 1)} disabled={i === specs.length - 1} className="text-slate-500 hover:text-[#ff5a00] disabled:opacity-25 px-1 text-xs leading-4" aria-label="ქვემოთ">
                    ▼
                  </button>
                </div>
                <input
                  placeholder="მაგ. სიმძლავრე"
                  value={s.label}
                  onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  list="spec-labels"
                  className={`${inputCls} w-2/5`}
                />
                <input
                  placeholder="მაგ. 2400 W"
                  value={s.value}
                  list={suggestions.specValues[s.label.trim()] ? `spec-values-${i}` : undefined}
                  onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                  className={inputCls}
                />
                {suggestions.specValues[s.label.trim()] && (
                  <datalist id={`spec-values-${i}`}>
                    {suggestions.specValues[s.label.trim()].map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                )}
                <Button type="button" variant="danger" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} aria-label="წაშლა">
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:sticky lg:top-6">
        <Card>
          <div className="grid gap-3">
            <Button disabled={pending}>{pending ? "ინახება…" : "შენახვა"}</Button>
            {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-[#ff5a00]" />
              საიტზე გამოჩნდეს
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[#ff5a00]" />
              პოპულარული (მთავარ გვერდზე პირველი)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="h-4 w-4 accent-[#ff5a00]" />
              „ახალი“ ნიშანი
            </label>
            {product && (
              <Button type="button" variant="danger" onClick={remove} disabled={pending}>
                პროდუქტის წაშლა
              </Button>
            )}
          </div>
        </Card>

        <Card title="კატეგორია">
          <select value={categoryId ?? ""} onChange={(e) => setCategoryId(Number(e.target.value) || null)} className={inputCls}>
            <option value="">— აირჩიეთ —</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </Card>

        <Card title="ლოჯისტიკური კლასი">
          <ShippingClassSelect
            value={shippingClassId}
            onChange={setShippingClassId}
            classes={classes}
            inherited={inheritedClass(categories, categoryId, classes)}
            inheritLabel="კატეგორიიდან"
          />
        </Card>

        <Card title="ფასი">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ფასი ₾ *" hint="მაგ. 399">
              <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className={inputCls} />
            </Field>
            <Field label="ძველი ფასი ₾" hint="ცარიელი = ფასდაკლება არა">
              <input type="number" step="0.01" min="0" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card title="მარაგი">
          {variants.length > 0 ? (
            <p className="text-sm text-slate-500">მარაგი ითვლება ვარიაციების მიხედვით.</p>
          ) : (
            <div className="grid gap-3">
              <Field label="რაოდენობა" hint="ცარიელი = არ ითვლება. შეკვეთისას ავტომატურად აკლდება.">
                <input type="number" min="0" step="1" value={stockQty} onChange={(e) => setStockQty(e.target.value)} placeholder="არ ითვლება" className={inputCls} />
              </Field>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tracked ? Number(stockQty) > 0 : inStock}
                  disabled={tracked}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="h-4 w-4 accent-[#ff5a00]"
                />
                მარაგშია {tracked && <span className="text-xs text-slate-500">(რაოდენობით)</span>}
              </label>
            </div>
          )}
        </Card>

        {variants.length === 0 && (
          <Card title="ფერი">
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <Field label="ფერის სახელი" hint="მაგ. შავი / ოქროსფერი">
                <input
                  value={colorName}
                  onChange={(e) => {
                    setColorName(e.target.value);
                    const known = suggestions.colors.find((c) => c.name === e.target.value);
                    if (known?.hex) setColorHex(known.hex);
                  }}
                  list="color-list"
                  className={inputCls}
                />
              </Field>
              <input
                type="color"
                value={colorHex || "#151515"}
                onChange={(e) => setColorHex(e.target.value)}
                className="h-11 w-12 rounded border border-slate-300 bg-white mb-0.5"
                aria-label="ფერი"
              />
            </div>
          </Card>
        )}
      </div>
      <datalist id="spec-labels">
        {suggestions.specLabels.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <datalist id="color-list">
        {suggestions.colors.map((c) => (
          <option key={c.name} value={c.name} />
        ))}
      </datalist>
    </form>
  );
}
