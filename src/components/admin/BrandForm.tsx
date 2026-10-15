"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { BrandRow } from "@/db/schema";
import { deleteBrand, saveBrand } from "@/lib/actions/admin";
import { Button, Card, Field, inputCls } from "./ui";
import { SingleImage } from "./ImageUploader";

export function BrandForm({ brand }: { brand: BrandRow | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [name, setName] = useState(brand?.name ?? "");
  const [logo, setLogo] = useState(brand?.logo ?? "");
  const [showInStrip, setShowInStrip] = useState(brand?.showInStrip ?? true);
  const [sortOrder, setSortOrder] = useState(String(brand?.sortOrder ?? 0));

  const save = () =>
    start(async () => {
      setMessage(null);
      const res = await saveBrand(brand?.id ?? null, { name, logo: logo || null, showInStrip, sortOrder });
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: "შენახულია ✓" });
      if (!brand) router.replace(`/admin/brands/${res.id}`);
      else router.refresh();
    });

  const remove = () => {
    if (!brand || !confirm(`წაიშალოს „${brand.name}“? პროდუქტები არ წაიშლება.`)) return;
    start(async () => {
      await deleteBrand(brand.id);
      router.replace("/admin/brands");
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
          <Field label="სახელი *" hint="პროდუქტის „ბრენდი“ ველში იგივე სახელი უნდა ეწეროს, რომ ფილტრი იმუშაოს">
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
          </Field>
          <Field label="რიგითობა" hint="ნაკლები რიცხვი = უფრო წინ">
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={`${inputCls} max-w-32`} />
          </Field>
          <div>
            <span className="block text-sm font-semibold mb-1.5">ლოგო</span>
            <SingleImage value={logo} onChange={setLogo} />
            <p className="text-xs text-slate-500 mt-2">საუკეთესოა SVG ან გამჭვირვალე PNG.</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="grid gap-3">
          <Button disabled={pending}>{pending ? "ინახება…" : "შენახვა"}</Button>
          {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showInStrip} onChange={(e) => setShowInStrip(e.target.checked)} className="h-4 w-4 accent-[#ff5a00]" />
            ჩანს ბრენდების ზოლში
          </label>
          {brand && (
            <Button type="button" variant="danger" onClick={remove} disabled={pending}>
              ბრენდის წაშლა
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}
