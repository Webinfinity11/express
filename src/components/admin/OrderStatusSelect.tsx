"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setOrderStatus } from "@/lib/actions/admin";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/admin-shared";
import { inputCls } from "./ui";

export function OrderStatusSelect({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      className={`${inputCls} w-auto font-semibold`}
      onChange={(e) =>
        start(async () => {
          await setOrderStatus(id, e.target.value);
          router.refresh();
        })
      }
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
