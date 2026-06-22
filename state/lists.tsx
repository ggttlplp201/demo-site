"use client";
import { createContext, useContext } from "react";
import { usePersistentState } from "./usePersistentState";
interface ListsCtx { saved: string[]; toggle(ref: string): void; has(ref: string): boolean; }
const Ctx = createContext<ListsCtx | null>(null);
export function ListsProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = usePersistentState<string[]>("dmm.lists", []);
  const toggle = (ref: string) => setSaved(p => p.includes(ref) ? p.filter(r => r !== ref) : [...p, ref]);
  const has = (ref: string) => saved.includes(ref);
  return <Ctx.Provider value={{ saved, toggle, has }}>{children}</Ctx.Provider>;
}
export function useLists() { const c = useContext(Ctx); if (!c) throw new Error("useLists outside ListsProvider"); return c; }
