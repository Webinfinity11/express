"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { duplicateProduct } from "@/lib/actions/admin";

/** ქმნის დამალულ ასლს და ხსნის მის რედაქტირებას. */
export function DuplicateButton({ id, className = "" }: { id: number; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title="დუბლიკატი (დამალული ასლი)"
      onClick={() =>
        start(async () => {
          const res = await duplicateProduct(id);
          if (res.ok && res.id) router.push(`/admin/products/${res.id}`);
          else if (!res.ok) alert(res.error);
        })
      }
      className={`text-sm font-semibold text-slate-600 hover:text-[#ff5a00] disabled:opacity-50 ${className}`}
    >
      {pending ? "იქმნება…" : "⧉ დუბლიკატი"}
    </button>
  );
}
