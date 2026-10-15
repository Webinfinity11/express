"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PromoRow } from "@/db/schema";
import { deletePromo, savePromo } from "@/lib/actions/admin";
import { Button, Card, Field, inputCls } from "./ui";

// თარიღი თბილისის დროით → "YYYY-MM-DD" (date input-ისთვის)
const toDay = (d: Date | null) => (d ? new Date(d.getTime() + 4 * 3600_000).toISOString().slice(0, 10) : "");

export function PromoForm({ promo }: { promo: PromoRow | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [code, setCode] = useState(promo?.code ?? "");
  const [kind, setKind] = useState<"percent" | "fixed">(promo?.kind === "fixed" ? "fixed" : "percent");
  const [value, setValue] = useState(promo ? String(promo.value) : "10");
  const [minTotal, setMinTotal] = useState(promo ? String(promo.minTotal) : "0");
  const [maxUses, setMaxUses] = useState(promo?.maxUses != null ? String(promo.maxUses) : "");
  const [startsAt, setStartsAt] = useState(toDay(promo?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDay(promo?.endsAt ?? null));
  const [active, setActive] = useState(promo?.active ?? true);

  const save = () =>
    start(async () => {
      setMessage(null);
      const res = await savePromo(promo?.id ?? null, { code, kind, value, minTotal: minTotal || 0, maxUses: maxUses || null, startsAt, endsAt, active });
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: "შენახულია ✓" });
      if (!promo) router.replace(`/admin/promos/${res.id}`);
      else router.refresh();
    });

  const remove = () => {
    if (!promo || !confirm(`წაიშალოს პრომოკოდი ${promo.code}?`)) return;
    start(async () => {
      await deletePromo(promo.id);
      router.replace("/admin/promos");
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
          <Field label="კოდი *" hint="მომხმარებელი ამას შეიყვანს კალათაში. მაგ. MIX10">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
              required
              className={`${inputCls} font-mono uppercase`}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="ფასდაკლების ტიპი">
              <select value={kind} onChange={(e) => setKind(e.target.value as "percent" | "fixed")} className={inputCls}>
                <option value="percent">პროცენტი (%)</option>
                <option value="fixed">ფიქსირებული თანხა (₾)</option>
              </select>
            </Field>
            <Field label={kind === "percent" ? "ფასდაკლება %" : "ფასდაკლება ₾"}>
              <input type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} required className={inputCls} />
            </Field>
            <Field label="მინიმალური შეკვეთა ₾" hint="0 = ნებისმიერი თანხა">
              <input type="number" step="0.01" min="0" value={minTotal} onChange={(e) => setMinTotal(e.target.value)} className={inputCls} />
            </Field>
            <Field label="გამოყენების ლიმიტი" hint={`ცარიელი = შეუზღუდავი${promo ? ` · გამოყენებულია ${promo.usedCount}-ჯერ` : ""}`}>
              <input type="number" step="1" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className={inputCls} />
            </Field>
            <Field label="მოქმედებს (დან)" hint="ცარიელი = დაუყოვნებლივ">
              <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
            </Field>
            <Field label="მოქმედებს (მდე)" hint="ცარიელი = უვადოდ">
              <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>
      </Card>
      <Card>
        <div className="grid gap-3">
          <Button disabled={pending}>{pending ? "ინახება…" : "შენახვა"}</Button>
          {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[#ff5a00]" />
            აქტიური
          </label>
          {promo && (
            <Button type="button" variant="danger" onClick={remove} disabled={pending}>
              პრომოკოდის წაშლა
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}
