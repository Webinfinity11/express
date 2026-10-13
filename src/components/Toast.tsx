"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/context/StoreContext";
import { Icon } from "./Icon";

const noop = () => () => {};

// Toast იხატება ღია dialog-ის შიგნით, რომ top-layer-ზე ზემოდან გამოჩნდეს
export function Toast() {
  const router = useRouter();
  const { toast, hideToast, undoRemove } = useStore();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return null;

  const host = document.querySelector("dialog[open]") ?? document.body;

  return createPortal(
    <div className={`toast${toast.visible ? " show" : ""}`} role="status" aria-live="polite">
      <span className="toast-icon">
        <Icon name="check" />
      </span>
      <span id="toastText">{toast.text}</span>
      {toast.action && (
        <button
          onClick={() => {
            if (toast.action === "undo") return undoRemove();
            hideToast();
            router.push("/cart");
          }}
        >
          {toast.action === "undo" ? "დაბრუნება" : "კალათა"}
        </button>
      )}
    </div>,
    host,
  );
}
