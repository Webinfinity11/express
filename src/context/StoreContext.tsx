"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BY_ID, CITIES, COUPONS, FREE_SHIPPING_FROM, SHIPPING_RATES, type City } from "@/lib/data";

export type InfoKey = "account" | "about" | "delivery" | "warranty" | "payment" | "contact" | "social" | "brands";
export type Modal = null | "cart" | "favorites" | "city" | "clear-cart" | `info:${InfoKey}`;
type Delivery = "courier" | "pickup";
type ToastAction = "cart" | "undo";
type Toast = { text: string; action?: ToastAction; visible: boolean };

export type Totals = {
  list: number; // ძველი ფასებით
  sub: number; // ფასდაკლებით
  sale: number;
  coupon: number;
  after: number;
  shipping: number;
  total: number;
  saved: number;
};

type Store = {
  cart: Record<string, number>;
  favorites: string[];
  city: City;
  delivery: Delivery;
  coupon: string;
  cartCount: number;
  totals: Totals;
  addToCart: (id: string, qty?: number, notify?: boolean) => boolean;
  setQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  setCity: (city: City) => void;
  setDelivery: (d: Delivery) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  modal: Modal;
  openModal: (m: Modal) => void;
  toast: Toast;
  showToast: (text: string, action?: ToastAction) => void;
  hideToast: () => void;
  undoRemove: () => void;
};

const Ctx = createContext<Store | null>(null);
const STORAGE_KEY = "express-mix-store-v2";
export const MAX_QTY = 99;
const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Number.isFinite(n) ? Math.trunc(n) : 1));

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [city, setCity] = useState<City>("tbilisi");
  const [delivery, setDelivery] = useState<Delivery>("courier");
  const [coupon, setCoupon] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState<Toast>({ text: "", visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastRemoved = useRef<{ id: string; qty: number } | null>(null);

  // localStorage-დან აღდგენა მხოლოდ კლიენტზე, mount-ის შემდეგ (hydration-ის შესაბამისად)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved?.cart && typeof saved.cart === "object") {
        const clean: Record<string, number> = {};
        for (const [id, qty] of Object.entries(saved.cart)) {
          if (BY_ID.has(id) && Number.isInteger(qty) && (qty as number) > 0) clean[id] = clampQty(qty as number);
        }
        setCart(clean);
      }
      if (Array.isArray(saved?.favorites)) setFavorites(saved.favorites.filter((id: string) => BY_ID.has(id)));
      if (saved?.city in CITIES) setCity(saved.city);
      if (saved?.delivery === "pickup") setDelivery("pickup");
      if (typeof saved?.coupon === "string" && saved.coupon in COUPONS) setCoupon(saved.coupon);
    } catch {}
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, favorites, city, delivery, coupon }));
    } catch {}
  }, [cart, favorites, city, delivery, coupon, loaded]);

  const showToast = useCallback((text: string, action?: ToastAction) => {
    clearTimeout(toastTimer.current);
    setToast({ text, action, visible: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4200);
  }, []);
  const hideToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  const addToCart = useCallback(
    (id: string, qty = 1, notify = true) => {
      if (!BY_ID.has(id)) return false;
      const before = cart[id] || 0;
      if (before >= MAX_QTY) {
        showToast("მაქსიმალური რაოდენობაა 99.");
        return false;
      }
      setCart((c) => ({ ...c, [id]: Math.min(MAX_QTY, (c[id] || 0) + clampQty(qty)) }));
      if (notify) {
        // კალათის გვერდის გარეთ მარჯვნიდან იხსნება გვერდითა კალათა
        if (before + qty > MAX_QTY) showToast("რაოდენობა შეიზღუდა 99 ერთეულამდე.");
        else if (window.location.pathname === "/cart") showToast("პროდუქტი დაემატა კალათაში");
        else setModal("cart");
      }
      return true;
    },
    [cart, showToast],
  );

  const setQuantity = useCallback((id: string, qty: number) => {
    setCart((c) => (c[id] ? { ...c, [id]: clampQty(qty) } : c));
  }, []);

  const removeFromCart = useCallback(
    (id: string) => {
      if (!cart[id]) return;
      lastRemoved.current = { id, qty: cart[id] };
      setCart((c) => {
        const copy = { ...c };
        delete copy[id];
        return copy;
      });
      showToast("პროდუქტი ამოღებულია კალათიდან", "undo");
    },
    [cart, showToast],
  );

  const undoRemove = useCallback(() => {
    const item = lastRemoved.current;
    if (!item) return;
    lastRemoved.current = null;
    setCart((c) => ({ ...c, [item.id]: item.qty }));
    hideToast();
  }, [hideToast]);

  const toggleFavorite = useCallback(
    (id: string) => {
      const had = favorites.includes(id);
      setFavorites((f) => (had ? f.filter((x) => x !== id) : [...f, id]));
      showToast(had ? "პროდუქტი ამოღებულია ფავორიტებიდან" : "პროდუქტი დაემატა ფავორიტებში");
    },
    [favorites, showToast],
  );

  const applyCoupon = useCallback(
    (code: string) => {
      const c = code.trim().toUpperCase();
      if (!(c in COUPONS)) return false;
      setCoupon(c);
      showToast(`პრომოკოდი ${c} გამოყენებულია.`);
      return true;
    },
    [showToast],
  );

  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);

  const totals = useMemo<Totals>(() => {
    const entries = Object.entries(cart).filter(([id]) => BY_ID.has(id));
    const list = entries.reduce((n, [id, q]) => n + Math.round(BY_ID.get(id)!.oldPrice * 100) * q, 0);
    const sub = entries.reduce((n, [id, q]) => n + Math.round(BY_ID.get(id)!.price * 100) * q, 0);
    const couponOff = coupon ? Math.round(sub * (COUPONS[coupon] ?? 0)) : 0;
    const after = sub - couponOff;
    const shipping = entries.length && delivery === "courier" && after < FREE_SHIPPING_FROM ? SHIPPING_RATES[city] : 0;
    return { list, sub, sale: list - sub, coupon: couponOff, after, shipping, total: after + shipping, saved: list - sub + couponOff };
  }, [cart, coupon, delivery, city]);

  return (
    <Ctx.Provider
      value={{
        cart,
        favorites,
        city,
        delivery,
        coupon,
        cartCount,
        totals,
        addToCart,
        setQuantity,
        removeFromCart,
        clearCart: () => {
          setCart({});
          setCoupon("");
        },
        isFavorite: (id) => favorites.includes(id),
        toggleFavorite,
        setCity,
        setDelivery,
        applyCoupon,
        removeCoupon: () => setCoupon(""),
        modal,
        openModal: setModal,
        toast,
        showToast,
        hideToast,
        undoRemove,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
