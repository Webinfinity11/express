"use client";

import Link from "next/link";
import type { ShippingClassRow } from "@/db/schema";
import { money } from "@/lib/data";
import { inputCls } from "./ui";

type Cat = { id: number; name: string; parentId: number | null; shippingClassId: number | null };

/** კატეგორიიდან (და მისი მშობლებიდან) მემკვიდრეობით მიღებული კლასი */
export function inheritedClass(cats: Cat[], categoryId: number | null, classes: ShippingClassRow[]) {
  for (let n = 0, c = cats.find((x) => x.id === categoryId); c && n < 10; n++, c = cats.find((x) => x.id === c!.parentId)) {
    const hit = c.shippingClassId && classes.find((k) => k.id === c!.shippingClassId);
    if (hit) return { cls: hit, from: c.name };
  }
  return null;
}

export function ShippingClassSelect({
  value,
  onChange,
  classes,
  inherited,
  inheritLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  classes: ShippingClassRow[];
  inherited: { cls: ShippingClassRow; from: string } | null;
  inheritLabel: string;
}) {
  if (!classes.length)
    return (
      <p className="text-sm text-slate-500">
        კლასები ჯერ არ არის.{" "}
        <Link href="/admin/shipping" className="font-semibold text-[#ff5a00]">
          შექმნა →
        </Link>
      </p>
    );
  const current = classes.find((c) => c.id === value) ?? inherited?.cls;
  return (
    <div className="grid gap-1.5">
      <select value={value ?? ""} onChange={(e) => onChange(Number(e.target.value) || null)} className={inputCls}>
        <option value="">{inherited ? `${inheritLabel} (${inherited.cls.code}, ${inherited.from})` : "— საერთო ტარიფი —"}</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {`${c.code} · თბილისი ${money(c.tbilisi)} ₾ / რეგიონები ${money(c.regions)} ₾`}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-500">
        {current
          ? `მიწოდება: თბილისი ${money(current.tbilisi)} ₾ · რეგიონები ${money(current.regions)} ₾ (ერთეულზე)`
          : "კლასის გარეშე მოქმედებს საერთო ტარიფი"}
      </p>
    </div>
  );
}
