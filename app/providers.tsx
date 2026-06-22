"use client";
import { CartProvider } from "@/state/cart";
import { ListsProvider } from "@/state/lists";
import { CompareProvider } from "@/state/compare";
export function Providers({ children }: { children: React.ReactNode }) {
  return <CartProvider><ListsProvider><CompareProvider>{children}</CompareProvider></ListsProvider></CartProvider>;
}
