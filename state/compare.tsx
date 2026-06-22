"use client";
import { createContext, useContext } from "react";
import { usePersistentState } from "./usePersistentState";
const MAX = 4;
interface CompareCtx { refs: string[]; toggle(ref: string): void; has(ref: string): boolean; canAdd: boolean; clear(): void; }
const Ctx = createContext<CompareCtx | null>(null);
export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [refs, setRefs] = usePersistentState<string[]>("dmm.compare", []);
  const toggle = (ref: string) => setRefs(p => p.includes(ref) ? p.filter(r => r !== ref) : (p.length < MAX ? [...p, ref] : p));
  const has = (ref: string) => refs.includes(ref);
  const clear = () => setRefs([]);
  return <Ctx.Provider value={{ refs, toggle, has, canAdd: refs.length < MAX, clear }}>{children}</Ctx.Provider>;
}
export function useCompare() { const c = useContext(Ctx); if (!c) throw new Error("useCompare outside CompareProvider"); return c; }
