"use client";

import { useEffect } from "react";
import { useStore } from "@/context/StoreContext";

/** გადახდის დადასტურების შემდეგ კალათის გასუფთავება */
export function ClearCart() {
  const { clearCart } = useStore();
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
