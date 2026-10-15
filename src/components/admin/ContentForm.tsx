"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FieldSpec, Sub } from "@/lib/content-schema";
import type { LinkOption } from "@/lib/site-links";
import { resetContent, saveContent } from "@/lib/actions/admin";
import { Button, Card, Field, inputCls } from "./ui";
import { SingleImage } from "./ImageUploader";
import { LinkField } from "./LinkField";

type Value = Record<string, unknown>;
type Row = Record<string, string>;
type Choices = { links: LinkOption[]; categories: { value: string; label: string }[] };

export function ContentForm({
  sectionKey,
  fields,
  initial,
  links,
  categories,
}: { sectionKey: string; fields: FieldSpec[]; initial: Value } & Choices) {
  const router = useRouter();
  const [value, setValue] = useState<Value>(initial);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (name: string, v: unknown) => setValue((cur) => ({ ...cur, [name]: v }));

  const save = () =>
    start(async () => {
      setMessage(null);
      const res = await saveContent(sectionKey, value);
      setMessage(res.ok ? { ok: true, text: "შენახულია ✓ საიტზე უკვე ჩანს." } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
    });

  const reset = () => {
    if (!confirm("დაბრუნდეს საწყისი ტექსტები? ამ სექციის ცვლილებები წაიშლება.")) return;
    start(async () => {
      await resetContent(sectionKey);
      router.refresh();
      setMessage({ ok: true, text: "საწყისი ტექსტები დაბრუნდა." });
      window.location.reload();
    });
  };

  return (
    <form
      className="grid lg:grid-cols-[1fr_280px] gap-5 items-start"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Card>
        <div className="grid gap-5">
          {fields.map((f) => (
            <FieldEditor key={f.name} spec={f} value={value[f.name]} onChange={(v) => set(f.name, v)} choices={{ links, categories }} />
          ))}
        </div>
      </Card>
      <div className="lg:sticky lg:top-6">
        <Card>
          <div className="grid gap-3">
            <Button disabled={pending}>{pending ? "ინახება…" : "შენახვა"}</Button>
            {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
            <Button type="button" variant="secondary" onClick={reset} disabled={pending}>
              საწყისი ტექსტების დაბრუნება
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}

function FieldEditor({ spec, value, onChange, choices }: { spec: FieldSpec; value: unknown; onChange: (v: unknown) => void; choices: Choices }) {
  if (spec.type === "toggle")
    return (
      <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[#ff5a00]" />
        <span className="font-semibold text-sm">{spec.label}</span>
      </label>
    );
  if (spec.type === "text")
    return (
      <Field label={spec.label} hint={spec.hint}>
        <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      </Field>
    );
  if (spec.type === "number")
    return (
      <Field label={spec.label} hint={spec.hint}>
        <input type="number" step="any" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      </Field>
    );
  if (spec.type === "image")
    return (
      <div>
        <span className="block text-sm font-semibold mb-1.5">{spec.label}</span>
        <SingleImage value={String(value ?? "")} onChange={onChange} />
      </div>
    );
  if (spec.type === "textarea")
    return (
      <Field label={spec.label} hint={spec.hint}>
        <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={3} className={inputCls} />
      </Field>
    );

  if (spec.type === "list") {
    const list = (Array.isArray(value) ? value : []) as string[];
    return (
      <Repeater
        label={spec.label}
        hint={spec.hint}
        count={list.length}
        onAdd={() => onChange([...list, ""])}
        onRemove={(i) => onChange(list.filter((_, j) => j !== i))}
        onMove={(i, d) => onChange(move(list, i, d))}
        render={(i) =>
          spec.long ? (
            <textarea value={list[i]} rows={3} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} className={inputCls} />
          ) : (
            <input value={list[i]} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} className={inputCls} />
          )
        }
      />
    );
  }

  if (spec.type !== "objects") return null;
  const rows = (Array.isArray(value) ? value : []) as Row[];
  const update = (i: number, k: string, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const sub = (f: Sub, i: number) => {
    const label = <span className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</span>;
    const v = rows[i][f.name] ?? "";
    if (f.image)
      return (
        <div key={f.name} className="sm:col-span-2">
          {label}
          <SingleImage value={v} onChange={(url) => update(i, f.name, url)} />
        </div>
      );
    if (f.options) {
      const opts = f.options === "categories" ? [{ value: "", label: "ყველა კატეგორია" }, ...choices.categories] : f.options;
      return (
        <label key={f.name} className="block">
          {label}
          <select value={v} onChange={(e) => update(i, f.name, e.target.value)} className={inputCls}>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      );
    }
    if (f.name === "href")
      return (
        <div key={f.name}>
          {label}
          <LinkField
            value={v}
            options={choices.links}
            onChange={(href) => update(i, "href", href)}
            // ტექსტის ველი ცარიელია → არჩეული გვერდის სახელი
            onPick={(href, l) => onChange(rows.map((r, j) => (j === i ? { ...r, href, ...("label" in r && !r.label ? { label: l } : {}) } : r)))}
          />
        </div>
      );
    if (f.long)
      return (
        <label key={f.name} className="block sm:col-span-2">
          {label}
          <textarea value={v} rows={3} onChange={(e) => update(i, f.name, e.target.value)} className={inputCls} />
        </label>
      );
    return (
      <label key={f.name} className="block">
        {label}
        <input value={v} onChange={(e) => update(i, f.name, e.target.value)} className={inputCls} />
      </label>
    );
  };
  return (
    <Repeater
      label={spec.label}
      hint={spec.hint}
      count={rows.length}
      fixed={spec.fixed}
      onAdd={() => onChange([...rows, Object.fromEntries(spec.fields.map((f) => [f.name, ""]))])}
      onRemove={(i) => onChange(rows.filter((_, j) => j !== i))}
      onMove={(i, d) => onChange(move(rows, i, d))}
      render={(i) => (
        <div className={`grid gap-2 ${spec.fields.some((f) => f.long) ? "" : "sm:grid-cols-2"}`}>
          {spec.fields.map((f) => sub(f, i))}
        </div>
      )}
    />
  );
}

function move<T>(list: T[], i: number, d: number) {
  const next = [...list];
  if (i + d < 0 || i + d >= next.length) return next;
  [next[i], next[i + d]] = [next[i + d], next[i]];
  return next;
}

function Repeater({
  label,
  hint,
  count,
  fixed,
  onAdd,
  onRemove,
  onMove,
  render,
}: {
  label: string;
  hint?: string;
  count: number;
  fixed?: boolean;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, d: number) => void;
  render: (i: number) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{label}</span>
        {!fixed && (
          <button type="button" onClick={onAdd} className="text-sm font-semibold text-[#ff5a00]">
            + დამატება
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500 mb-2">{hint}</p>}
      <div className="grid gap-2">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex gap-2 items-start rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="flex flex-col gap-1 pt-1">
              <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} className="text-slate-500 disabled:opacity-25 px-1" aria-label="ზემოთ">
                ▲
              </button>
              <button type="button" onClick={() => onMove(i, 1)} disabled={i === count - 1} className="text-slate-500 disabled:opacity-25 px-1" aria-label="ქვემოთ">
                ▼
              </button>
            </div>
            <div className="flex-1 min-w-0">{render(i)}</div>
            {!fixed && (
              <button type="button" onClick={() => onRemove(i)} className="text-red-600 px-2 py-2" aria-label="წაშლა">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
