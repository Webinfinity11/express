"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ShippingClassRow } from "@/db/schema";
import { saveShippingClasses } from "@/lib/actions/admin";
import { Button, Card, inputCls } from "./ui";

type Draft = { id: number | null; code: string; tbilisi: string; regions: string };

// პირველი გახსნისას — გადამზიდების სტანდარტული კლასები (შენახვამდე არ ინახება)
const DEFAULTS: Draft[] = ["S", "M", "L", "XL"].map((code) => ({ id: null, code, tbilisi: "", regions: "" }));

export function ShippingClassesForm({ classes, usage }: { classes: ShippingClassRow[]; usage: Record<number, { cats: number; products: number }> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [rows, setRows] = useState<Draft[]>(
    classes.length
      ? classes.map((c) => ({ id: c.id, code: c.code, tbilisi: String(c.tbilisi), regions: String(c.regions) }))
      : DEFAULTS,
  );

  const set = (i: number, patch: Partial<Draft>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = () =>
    start(async () => {
      setMessage(null);
      const res = await saveShippingClasses(rows.map((r) => ({ ...r, name: "", tbilisi: r.tbilisi || 0, regions: r.regions || 0 })));
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: "შენახულია ✓" });
      router.refresh();
    });

  const remove = (i: number) => {
    const r = rows[i];
    const u = r.id ? usage[r.id] : undefined;
    if (u && (u.cats || u.products) && !confirm(`კლასი ${r.code} მინიჭებულია (${u.cats} კატეგორია, ${u.products} პროდუქტი). წაიშალოს?`)) return;
    setRows((rs) => rs.filter((_, j) => j !== i));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="grid gap-5"
    >
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="p-2 w-24">კლასი</th>
                <th className="p-2 w-32">თბილისი ₾</th>
                <th className="p-2 w-32">რეგიონები ₾</th>
                <th className="p-2 w-28 text-center">მინიჭებულია</th>
                <th className="p-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const u = r.id ? usage[r.id] : undefined;
                return (
                  <tr key={r.id ?? `new-${i}`} className="border-t border-slate-100">
                    <td className="p-2">
                      <input
                        value={r.code}
                        onChange={(e) => set(i, { code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                        required
                        className={`${inputCls} font-mono font-bold uppercase`}
                      />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.01" min="0" value={r.tbilisi} onChange={(e) => set(i, { tbilisi: e.target.value })} className={inputCls} />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.01" min="0" value={r.regions} onChange={(e) => set(i, { regions: e.target.value })} className={inputCls} />
                    </td>
                    <td className="p-2 text-center text-slate-500 whitespace-nowrap">
                      {u ? `${u.cats} კატ. · ${u.products} პრ.` : "—"}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 whitespace-nowrap"
                      >
                        წაშლა
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, { id: null, code: "", tbilisi: "", regions: "" }])}
          className="mt-3 text-sm font-semibold text-[#ff5a00]"
        >
          + კლასის დამატება
        </button>
      </Card>
      <div className="flex items-center gap-4">
        <Button disabled={pending}>{pending ? "ინახება…" : "შენახვა"}</Button>
        {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
      </div>
    </form>
  );
}
