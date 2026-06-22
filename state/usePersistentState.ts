"use client";
import { useEffect, useState } from "react";
export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setState(JSON.parse(raw)); } catch {}
    setHydrated(true);
  }, [key]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state, hydrated]);
  return [state, setState] as const;
}
