"use client";
import { createContext, useContext } from "react";
import { usePersistentState } from "./usePersistentState";
import type { BomItem } from "@/lib/bom";

interface CartCtx { items: BomItem[]; add(ref: string, qty: number): void; remove(ref: string): void; setQty(ref: string, qty: number): void; clear(): void; count: number; }
const Ctx = createContext<CartCtx | null>(null);
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = usePersistentState<BomItem[]>("dmm.cart", []);
  const add = (ref: string, qty: number) => setItems(prev => {
    const f = prev.find(i => i.ref === ref);
    return f ? prev.map(i => i.ref === ref ? { ...i, quantity: i.quantity + qty } : i) : [...prev, { ref, quantity: qty }];
  });
  const remove = (ref: string) => setItems(prev => prev.filter(i => i.ref !== ref));
  const setQty = (ref: string, qty: number) => setItems(prev => prev.map(i => i.ref === ref ? { ...i, quantity: qty } : i));
  const clear = () => setItems([]);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  return <Ctx.Provider value={{ items, add, remove, setQty, clear, count }}>{children}</Ctx.Provider>;
}
export function useCart() { const c = useContext(Ctx); if (!c) throw new Error("useCart outside CartProvider"); return c; }
