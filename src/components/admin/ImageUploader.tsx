"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/actions/admin";

/** სურათები იტვირთება Blob-ში მაშინვე; მშობელი ინახავს მხოლოდ URL-ებს. პირველი = მთავარი. */
export function ImageUploader({ value, onChange, max = 12 }: { value: string[]; onChange: (urls: string[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = [...files].slice(0, Math.max(1, max - value.length));
    setBusy(list.length);
    const urls: string[] = [];
    for (const file of list) {
      const form = new FormData();
      form.set("file", file);
      const res = await uploadImage(form);
      if (res.ok) urls.push(res.url);
      else setError(res.error);
      setBusy((n) => n - 1);
    }
    onChange(max === 1 ? urls.slice(-1) : [...value, ...urls].slice(0, max));
    if (input.current) input.current.value = "";
  }

  const move = (i: number, d: number) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className={max === 1 ? "grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md" : "grid grid-cols-3 sm:grid-cols-4 gap-3"}>
        {value.map((url, i) => (
          <div key={url} className="relative aspect-square rounded-lg border border-slate-200 bg-white">
            <img src={url} alt="" className="absolute inset-0 w-full h-full object-contain p-2" />
            {max > 1 && i === 0 && <span className="absolute left-1 top-1 text-[11px] bg-[#ff5a00] text-white rounded px-1.5">მთავარი</span>}
            <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
              {max > 1 && (
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="bg-white/90 border rounded px-2 text-sm disabled:opacity-30" aria-label="მარცხნივ">
                  ←
                </button>
              )}
              <button type="button" onClick={() => onChange(value.filter((u) => u !== url))} className="bg-white/90 border border-red-200 text-red-600 rounded px-2 text-sm">
                წაშლა
              </button>
              {max > 1 && (
                <button
                  type="button"
                  disabled={i === value.length - 1}
                  onClick={() => move(i, 1)}
                  className="bg-white/90 border rounded px-2 text-sm disabled:opacity-30"
                  aria-label="მარჯვნივ"
                >
                  →
                </button>
              )}
            </div>
          </div>
        ))}
        {(value.length < max || max === 1) && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy > 0}
            className="aspect-square rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-[#ff5a00] hover:text-[#ff5a00] text-sm font-semibold"
          >
            {busy > 0 ? `იტვირთება… (${busy})` : max === 1 && value.length ? "შეცვლა" : "+ სურათი"}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple={max > 1} hidden onChange={(e) => upload(e.target.files)} />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

/** ერთი სურათის ველი (კატეგორია, ბრენდი, ბანერი, ვარიაცია) */
export function SingleImage({ value, onChange }: { value: string | null | undefined; onChange: (url: string) => void }) {
  return <ImageUploader value={value ? [value] : []} onChange={(urls) => onChange(urls[0] ?? "")} max={1} />;
}
