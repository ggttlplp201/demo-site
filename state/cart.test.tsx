import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";

beforeEach(() => localStorage.clear());
const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;

describe("useCart", () => {
  it("adds, increments, and counts items", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.add("R1", 2));
    act(() => result.current.add("R1", 3));
    expect(result.current.items.find(i => i.ref === "R1")?.quantity).toBe(5);
    expect(result.current.count).toBe(5);
  });
  it("persists to localStorage", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.add("R2", 1));
    expect(localStorage.getItem("dmm.cart")).toContain("R2");
  });
});
