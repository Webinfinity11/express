"use client";

import { useStore, type InfoKey } from "@/context/StoreContext";

/** ღილაკი, რომელიც ინფორმაციულ ფანჯარას ხსნის — გამოიყენება სერვერულ კომპონენტებშიც */
export function InfoButton({ info, className, children, ...rest }: { info: InfoKey; className?: string; children: React.ReactNode } & React.AriaAttributes) {
  const { openModal } = useStore();
  return (
    <button className={className} onClick={() => openModal(`info:${info}`)} {...rest}>
      {children}
    </button>
  );
}
