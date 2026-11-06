"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { uploadImage } from "@/lib/actions/admin";
import { attachPhotos, matchPhotoFiles } from "@/lib/actions/import-export";
import type { PhotoMatch } from "@/lib/photo-match";
import { shrink } from "./ImageUploader";
import { Button, Card } from "./ui";

type Matched = Extract<PhotoMatch, { status: "matched" }>;
type Summary = { products: number; photos: number; failed: string[] };

const problemText = (m: PhotoMatch) => {
  if (m.status === "unmatched") return "ამ დასახელების პროდუქტი ვერ მოიძებნა";
  if (m.status === "ambiguous") return `„${m.productName}“ ${m.count} პროდუქტს ჰქვია, ფოტო არ მიება. სახელი გაასხვავეთ`;
  if (m.status === "duplicate") return `„${m.productName}“: იგივე ნომრის ფოტო უკვე არჩეულია`;
  return "";
};

export function PhotoUploadPanel() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [matches, setMatches] = useState<PhotoMatch[] | null>(null);
  const [replace, setReplace] = useState(false);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  const clear = () => {
    setFiles([]);
    setMatches(null);
    setReplace(false);
    if (input.current) input.current.value = "";
  };

  const choose = async (list: File[]) => {
    setFiles(list);
    setMatches(null);
    setSummary(null);
    setError("");
    if (!list.length) return;
    setChecking(true);
    try {
      const res = await matchPhotoFiles(list.map((f) => f.name));
      if (res.ok) setMatches(res.matches);
      else setError(res.error);
    } catch {
      setError("ფოტოები ვერ შემოწმდა. სცადეთ თავიდან");
    } finally {
      setChecking(false);
    }
  };

  const matched = (matches ?? []).filter((m): m is Matched => m.status === "matched");
  const problems = (matches ?? []).filter((m) => m.status !== "matched");
  const groups = [...new Set(matched.map((m) => m.productId))].map((id) =>
    matched.filter((m) => m.productId === id).sort((a, b) => a.order - b.order),
  );

  const upload = async () => {
    setError("");
    setSummary(null);
    setProgress({ done: 0, total: matched.length });
    const failed: string[] = [];
    let photos = 0;
    let done = 0;
    let linked = 0;
    try {
      for (const group of groups) {
        const urls: string[] = [];
        let groupFailed = false;
        for (const m of group) {
          const file = files.find((f) => f.name === m.file);
          try {
            const form = new FormData();
            form.append("file", await shrink(file!));
            const res = await uploadImage(form);
            if (res.ok) urls.push(res.url);
            else {
              failed.push(`${m.file}: ${res.error}`);
              groupFailed = true;
            }
          } catch {
            failed.push(`${m.file}: ატვირთვა ვერ მოხერხდა`);
            groupFailed = true;
          }
          setProgress({ done: ++done, total: matched.length });
        }
        // ჩანაცვლებისას ნაწილობრივ ატვირთვამ ძველი ფოტოები არ უნდა დაკარგოს
        if (!urls.length) continue;
        if (replace && groupFailed) {
          failed.push(`${group[0].productName}: ძველი ფოტოები დარჩა, რადგან ყველა ახალი ვერ აიტვირთა`);
          continue;
        }
        const res = await attachPhotos({ productId: group[0].productId, urls, replace });
        if (!res.ok) failed.push(`${group[0].productName}: ${res.error}`);
        else {
          photos += res.added;
          if (res.added) linked++;
          if (res.skipped) failed.push(`${group[0].productName}: ${res.skipped} ფოტო არ დაემატა, ლიმიტი 12-ია`);
        }
      }
      setSummary({ products: linked, photos, failed });
      clear();
      router.refresh();
    } catch {
      setError("ატვირთვა შეწყდა. შეამოწმეთ პროდუქცია და სცადეთ დარჩენილი ფოტოები");
    } finally {
      setProgress(null);
    }
  };

  const busy = checking || progress !== null;

  return (
    <Card title="ფოტოების ატვირთვა დასახელებით">
      <p className="text-sm text-slate-600 mb-2">ფაილის სახელი პროდუქტის დასახელებას უნდა ემთხვეოდეს:</p>
      <ul className="text-sm text-slate-600 list-disc pl-5 mb-4 grid gap-1">
        <li>
          <b>Franko აეროგრილი FAF-1217.jpg</b>: პირველი ფოტო
        </li>
        <li>
          <b>Franko აეროგრილი FAF-1217-2.jpg</b>: მეორე ფოტო, ასევე მოქმედებს <b>(2)</b> და <b>_2</b>
        </li>
      </ul>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/*"
        disabled={busy}
        onChange={(e) => choose([...(e.target.files ?? [])])}
        className="block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#ff5a00] file:px-4 file:py-2.5 file:font-semibold file:text-white"
      />
      {checking && <p className="mt-3 text-sm text-slate-500">ფოტოები მოწმდება…</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {summary && (
        <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm">
          <p className="font-semibold text-green-800">
            აიტვირთა {summary.photos} ფოტო, {summary.products} პროდუქტზე.
          </p>
          {summary.failed.length > 0 && (
            <ul className="mt-2 grid gap-1 text-red-700">
              {summary.failed.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {matches && (
        <div className="mt-4">
          <p className="text-sm font-semibold mb-3">
            მიება {matched.length} ფოტო, {groups.length} პროდუქტზე. პრობლემური: {problems.length}.
          </p>

          {problems.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-red-700 mb-2">ეს ფოტოები არ აიტვირთება</h3>
              <ul className="text-sm grid gap-1 max-h-60 overflow-y-auto">
                {problems.map((m) => (
                  <li key={m.file}>
                    <b>{m.file}:</b> {problemText(m)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {groups.length > 0 && (
            <>
              <div className="overflow-auto max-h-96 mb-4 border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500 sticky top-0">
                    <tr>
                      <th className="p-2">პროდუქტი</th>
                      <th className="p-2">ფაილები</th>
                      <th className="p-2">ახლა აქვს</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groups.map((group) => (
                      <tr key={group[0].productId}>
                        <td className="p-2 font-semibold">
                          {group[0].productName}
                          {!group[0].published && <span className="ml-2 font-normal text-amber-700">დამალულია</span>}
                        </td>
                        <td className="p-2 text-slate-600">{group.map((m) => m.file).join(", ")}</td>
                        <td className="p-2">{group[0].imageCount} ფოტო</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
                <input type="checkbox" checked={replace} disabled={busy} onChange={(e) => setReplace(e.target.checked)} />
                არსებული ფოტოები ჩანაცვლდეს. მონიშვნის გარეშე ახალი ფოტოები ძველებს დაემატება.
              </label>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!matched.length || busy} onClick={upload}>
              {progress ? `იტვირთება ${progress.done} / ${progress.total}…` : `${matched.length} ფოტოს ატვირთვა`}
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={clear}>
              გაუქმება
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
