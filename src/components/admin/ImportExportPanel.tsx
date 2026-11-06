"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { applyImport, previewImport, type ImportPreview, type ImportResult } from "@/lib/actions/import-export";
import { Button, Card } from "./ui";

const linkCls =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition bg-white border border-slate-300 hover:border-[#ff5a00] hover:text-[#ff5a00]";

/** იმპორტამდე მიმდინარე კატალოგი გადმოიწერება, რომ ცვლილებები უკან დაბრუნდეს. */
async function downloadBackup() {
  const res = await fetch("/admin/import-export/export", { cache: "no-store" });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.includes("spreadsheetml")) return false;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = `emix-backup-before-import-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export function ImportExportPanel({ total }: { total: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Extract<ImportPreview, { ok: true }> | null>(null);
  const [result, setResult] = useState<Extract<ImportResult, { ok: true }> | null>(null);
  const [error, setError] = useState("");
  const [checking, startCheck] = useTransition();
  const [applying, startApply] = useTransition();

  const send = (f: File) => {
    const form = new FormData();
    form.append("file", f);
    return form;
  };

  const choose = (f: File | undefined) => {
    setFile(f ?? null);
    setPreview(null);
    setResult(null);
    setError("");
    if (!f) return;
    startCheck(async () => {
      try {
        const res = await previewImport(send(f));
        if (res.ok) setPreview(res);
        else setError(res.error);
      } catch {
        setError("ფაილი ვერ შემოწმდა. სცადეთ თავიდან");
      }
    });
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    if (input.current) input.current.value = "";
  };

  const apply = () => {
    if (!file) return;
    setError("");
    startApply(async () => {
      try {
        if (!(await downloadBackup())) {
          setError("სარეზერვო ასლი ვერ გადმოიწერა, იმპორტი არ დაწყებულა");
          return;
        }
        const res = await applyImport(send(file));
        if (res.ok) {
          setResult(res);
          reset();
          router.refresh();
        } else setError(res.error);
      } catch {
        setError("იმპორტი ვერ დასრულდა. შეამოწმეთ პროდუქცია და სცადეთ თავიდან");
      }
    });
  };

  const hasChanges = preview && preview.created + preview.updated > 0;

  return (
    <div className="grid gap-5 max-w-5xl">
      <Card title="ექსპორტი და შაბლონი">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <h3 className="font-semibold mb-1">ახალი პროდუქტებისთვის</h3>
            <p className="text-sm text-slate-500 mb-3">ცარიელი Excel ფაილი ყველა სვეტით და კატეგორიების სიით.</p>
            <a href="/admin/import-export/template" className={linkCls}>
              შაბლონის გადმოწერა
            </a>
          </div>
          <div>
            <h3 className="font-semibold mb-1">არსებული პროდუქტების შესაცვლელად</h3>
            <p className="text-sm text-slate-500 mb-3">ყველა პროდუქტი ({total}) Excel ფაილად. შეცვალეთ და ატვირთეთ უკან.</p>
            <a href="/admin/import-export/export" className={linkCls}>
              ექსპორტი
            </a>
          </div>
        </div>
      </Card>

      <Card title="იმპორტი">
        <ul className="text-sm text-slate-600 list-disc pl-5 mb-4 grid gap-1">
          <li>ჯერ ნახავთ, რა დაემატება და რა შეიცვლება. დადასტურებამდე არაფერი იწერება.</li>
          <li>ცარიელი უჯრა არსებულ პროდუქტზე ველს არ ცვლის. გასასუფთავებლად ჩაწერეთ - (ტირე).</li>
          <li>იმპორტი პროდუქტს არ შლის. ვარიაციები უცვლელი რჩება.</li>
        </ul>
        <input
          ref={input}
          type="file"
          accept=".xlsx"
          disabled={checking || applying}
          onChange={(e) => choose(e.target.files?.[0])}
          className="block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#ff5a00] file:px-4 file:py-2.5 file:font-semibold file:text-white"
        />
        {checking && <p className="mt-3 text-sm text-slate-500">ფაილი მოწმდება…</p>}
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        {result && (
          <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-800">
            იმპორტი დასრულდა: დაემატა {result.created}, განახლდა {result.updated}, უცვლელი {result.same}. ძველი მონაცემები გადმოწერილ ასლშია.
          </p>
        )}
      </Card>

      {preview && (
        <Card title="გადახედვა">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {(
              [
                ["დაემატება", preview.created],
                ["განახლდება", preview.updated],
                ["უცვლელი", preview.same],
                ["შეცდომა", preview.errors.length],
              ] as const
            ).map(([label, n]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <div className={`text-2xl font-bold ${label === "შეცდომა" && n > 0 ? "text-red-600" : ""}`}>{n}</div>
                <div className="text-sm text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          {preview.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-red-700 mb-2">გაასწორეთ ეს შეცდომები და ატვირთეთ ფაილი თავიდან</h3>
              <ul className="text-sm grid gap-1 max-h-72 overflow-y-auto">
                {preview.errors.map((e, i) => (
                  <li key={i}>
                    <b>სტრიქონი {e.row}:</b> {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.warnings.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-amber-700 mb-2">შენიშვნები</h3>
              <ul className="text-sm grid gap-1 max-h-48 overflow-y-auto">
                {preview.warnings.map((w, i) => (
                  <li key={i}>
                    <b>სტრიქონი {w.row}:</b> {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.items.length > 0 && (
            <div className="overflow-x-auto max-h-96 overflow-y-auto mb-4 border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-2">სტრიქონი</th>
                    <th className="p-2">პროდუქტი</th>
                    <th className="p-2">SKU</th>
                    <th className="p-2">ცვლილება</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.items.map((item) => (
                    <tr key={item.row}>
                      <td className="p-2">{item.row}</td>
                      <td className="p-2 font-semibold">{item.name}</td>
                      <td className="p-2">{item.sku}</td>
                      <td className="p-2 text-slate-600">{item.action === "create" ? "ახალი პროდუქტი" : item.changes.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!hasChanges && preview.errors.length === 0 && <p className="text-sm text-slate-500 mb-4">ფაილში ცვლილება არ არის.</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!hasChanges || preview.errors.length > 0 || applying} onClick={apply}>
              {applying ? "იწერება…" : "იმპორტის დადასტურება"}
            </Button>
            <Button type="button" variant="secondary" disabled={applying} onClick={reset}>
              გაუქმება
            </Button>
          </div>
          {preview.errors.length === 0 && hasChanges && (
            <p className="mt-2 text-xs text-slate-500">დადასტურებისას ჯერ ამჟამინდელი კატალოგის სარეზერვო ასლი გადმოიწერება.</p>
          )}
        </Card>
      )}
    </div>
  );
}
