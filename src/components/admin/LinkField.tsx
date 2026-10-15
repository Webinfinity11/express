"use client";

import { editUrlFor, type LinkOption } from "@/lib/site-links";
import { inputCls } from "./ui";

/**
 * ბმულის ველი: ხელით ჩაწერა ან სიიდან არჩევა (გვერდები, კატეგორიები, პროდუქცია),
 * გვერდზე გადასვლა და მისი რედაქტორის გახსნა ახალ ჩანართში.
 */
export function LinkField({
  value,
  onChange,
  options,
  onPick,
}: {
  value: string;
  onChange: (href: string) => void;
  options: LinkOption[];
  /** სიიდან არჩევისას: ბმული + გვერდის სახელი (ტექსტის ველის შესავსებად) */
  onPick?: (href: string, label: string) => void;
}) {
  const groups = [...new Set(options.map((o) => o.group))];
  const edit = editUrlFor(value, options);
  const btn = "shrink-0 grid place-items-center w-10 rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-[#ff5a00] hover:text-[#ff5a00]";

  return (
    <div className="grid gap-1.5">
      <div className="flex gap-1.5">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/about" className={`${inputCls} min-w-0`} />
        {value && (
          <a href={value} target="_blank" rel="noopener" className={btn} title="გვერდის ნახვა" aria-label="გვერდის ნახვა">
            ↗
          </a>
        )}
        {edit && (
          <a href={edit} target="_blank" className={btn} title="ამ გვერდის რედაქტირება" aria-label="ამ გვერდის რედაქტირება">
            ✎
          </a>
        )}
      </div>
      <select
        value=""
        onChange={(e) => {
          const o = options.find((x) => x.href === e.target.value);
          if (!o) return;
          if (onPick) onPick(o.href, o.label.replace(/^(— )+/, ""));
          else onChange(o.href);
        }}
        className="w-full rounded-lg border border-dashed border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-600"
      >
        <option value="">აირჩიეთ გვერდი სიიდან…</option>
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {options
              .filter((o) => o.group === g)
              .map((o) => (
                <option key={o.href} value={o.href}>
                  {o.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
