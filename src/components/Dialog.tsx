"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  className: string;
  labelledBy?: string;
  label?: string;
  children: React.ReactNode;
};

export function Dialog({ open, onClose, className, labelledBy, label, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  // პროგრამული დახურვა (open=false) onClose-ს აღარ იძახებს — სხვა ფანჯარაზე გადართვისას state არ უნდა წაიშალოს
  const closingFromProp = useRef(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.body.classList.add("locked");
    } else if (!open && d.open) {
      closingFromProp.current = true;
      d.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={labelledBy}
      aria-label={label}
      onClose={() => {
        if (!document.querySelector("dialog[open]")) document.body.classList.remove("locked");
        if (closingFromProp.current) {
          closingFromProp.current = false;
          return;
        }
        onClose();
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
