"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { RedirectRow } from "@/db/schema";
import { deleteRedirect, saveRedirect, setRedirectActive, type RedirectInput } from "@/lib/actions/seo";
import { MATCH_TYPES, REDIRECT_CODES, type MatchType } from "@/lib/seo-shared";
import { Button, Card, Field, inputCls } from "../ui";

const CODE_LABELS: Record<number, string> = {
  301: "301 Permanent Move",
  302: "302 Temporary Move",
  307: "307 Temporary Redirect",
  410: "410 Content Deleted",
  451: "451 Unavailable For Legal Reasons",
};

type Draft = { id: number | null; source: string; matchType: MatchType; target: string; code: number; active: boolean };
const empty: Draft = { id: null, source: "", matchType: "exact", target: "", code: 301, active: true };

export function RedirectsManager({ rows }: { rows: RedirectRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter((r) => r.source.toLowerCase().includes(s) || r.target.toLowerCase().includes(s)) : rows;
  }, [rows, q]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      setError("");
      const r = await fn();
      if (!r.ok) return setError(r.error ?? "შეცდომა");
      after?.();
      router.refresh();
    });

  const noTarget = draft && (draft.code === 410 || draft.code === 451);

  return (
    <div className="grid gap-5">
      {draft ? (
        <Card title={draft.id ? "გადამისამართების რედაქტირება" : "ახალი გადამისამართება"}>
          <div className="grid gap-4 max-w-3xl">
            <div className="grid sm:grid-cols-[1fr_160px] gap-3">
              <Field label="წყარო (Source URL)" hint={draft.matchType === "regex" ? "მაგ. ^/old-shop/(.*)$" : "მაგ. /product/old-slug ან სრული ბმული ძველი საიტიდან"}>
                <input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} className={`${inputCls} font-mono text-sm`} autoFocus />
              </Field>
              <Field label="დამთხვევა">
                <select value={draft.matchType} onChange={(e) => setDraft({ ...draft, matchType: e.target.value as MatchType })} className={inputCls}>
                  {Object.entries(MATCH_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {!noTarget && (
              <Field label="სამიზნე (Destination URL)" hint={draft.matchType === "regex" ? "$1, $2 — regex-ის ჯგუფები" : "მაგ. /product/new-slug ან https://..."}>
                <input value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} className={`${inputCls} font-mono text-sm`} />
              </Field>
            )}
            <div>
              <span className="block text-sm font-semibold mb-1.5">გადამისამართების ტიპი</span>
              <div className="flex flex-wrap gap-2">
                {REDIRECT_CODES.map((c) => (
                  <label key={c} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${draft.code === c ? "border-[#ff5a00] bg-orange-50 text-[#ff5a00] font-semibold" : "border-slate-300 bg-white"}`}>
                    <input type="radio" className="sr-only" checked={draft.code === c} onChange={() => setDraft({ ...draft, code: c })} />
                    {CODE_LABELS[c]}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="size-4 accent-[#ff5a00]" />
              აქტიური
            </label>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button
                disabled={pending}
                onClick={() => {
                  const { id, ...input } = draft;
                  run(() => saveRedirect(id, input as RedirectInput), () => setDraft(null));
                }}
              >
                {pending ? "ინახება…" : "შენახვა"}
              </Button>
              <Button variant="secondary" onClick={() => (setDraft(null), setError(""))}>
                გაუქმება
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setDraft(empty)}>+ ახალი გადამისამართება</Button>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ძებნა…" className={`${inputCls} max-w-xs`} />
          {error && <span className="text-sm font-semibold text-red-600">{error}</span>}
        </div>
      )}

      <Card>
        {list.length === 0 ? (
          <p className="text-slate-500 text-sm">{rows.length ? "ვერაფერი მოიძებნა" : "გადამისამართებები ჯერ არ არის."}</p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-2 font-semibold">წყარო</th>
                  <th className="px-3 py-2 font-semibold">სამიზნე</th>
                  <th className="px-3 py-2 font-semibold">ტიპი</th>
                  <th className="px-3 py-2 font-semibold text-right">Hits</th>
                  <th className="px-3 py-2 font-semibold">ბოლოს</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className={`border-b border-slate-100 ${r.active ? "" : "opacity-50"}`}>
                    <td className="px-5 py-2.5 font-mono text-xs break-all">
                      {r.source}
                      {r.matchType !== "exact" && <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 font-sans text-[11px] text-slate-500">{MATCH_TYPES[r.matchType as MatchType]}</span>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs break-all">{r.target || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{r.code}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.hits}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{r.lastHit ? new Date(r.lastHit).toLocaleDateString("ka-GE") : "—"}</td>
                    <td className="px-5 py-2.5 whitespace-nowrap text-right">
                      <button
                        className="font-semibold text-[#ff5a00] mr-3"
                        onClick={() => setDraft({ id: r.id, source: r.source, matchType: r.matchType as MatchType, target: r.target, code: r.code, active: r.active })}
                      >
                        რედაქტირება
                      </button>
                      <button className="font-semibold text-slate-600 mr-3" disabled={pending} onClick={() => run(() => setRedirectActive(r.id, !r.active))}>
                        {r.active ? "გამორთვა" : "ჩართვა"}
                      </button>
                      <DeleteButton onConfirm={() => run(() => deleteRedirect(r.id))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/** ორსაფეხურიანი წაშლა (ბრაუზერის confirm-ის გარეშე) */
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [ask, setAsk] = useState(false);
  return ask ? (
    <span className="inline-flex gap-2">
      <button className="font-semibold text-red-600" onClick={onConfirm}>
        დიახ, წაშლა
      </button>
      <button className="text-slate-500" onClick={() => setAsk(false)}>
        არა
      </button>
    </span>
  ) : (
    <button className="font-semibold text-red-600" onClick={() => setAsk(true)}>
      წაშლა
    </button>
  );
}
