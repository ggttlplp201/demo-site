import { describe, it, expect } from "vitest";
import { matchProducts } from "./match";
import type { Requirement } from "./types";
import type { Product } from "@/lib/types";

const reqs: Requirement[] = [
  { key: "ce", labelKey: "", value: "CE", mandatory: true, match: { field: "compliance.ce.value", op: "present" } },
  { key: "ip", labelKey: "", value: "IP67", mandatory: true, match: { field: "shared_specs.ip_rating", op: "gte", value: 67 } },
  { key: "cri", labelKey: "", value: "≥80", mandatory: false, match: { field: "shared_specs.cri", op: "present" } },
  { key: "corrosion", labelKey: "", value: "", mandatory: true }, // no match spec -> untestable
];

const productA = {
  id: "a",
  compliance: { ce: { value: "CE" } },
  shared_specs: { ip_rating: 67, cri: "≥80" },
} as unknown as Product;

const productB = {
  id: "b",
  compliance: { ce: { value: "PLACEHOLDER" } },
  shared_specs: { ip_rating: 44 },
} as unknown as Product;

describe("matchProducts", () => {
  it("ranks the fully-satisfying product first and flags it perfect", () => {
    const res = matchProducts(reqs, [productB, productA]);
    expect(res.best?.product.id).toBe("a");
    expect(res.best?.score).toBe(3);
    expect(res.best?.testable).toBe(3);
    expect(res.best?.satisfied).toEqual(expect.arrayContaining(["ce", "ip", "cri"]));
    expect(res.perfect).toBe(true);
  });

  it("reports untestable requirements (no match spec) separately", () => {
    const res = matchProducts(reqs, [productA]);
    expect(res.best?.untestable).toEqual(["corrosion"]);
  });

  it("scores a non-satisfying product zero and lists its misses", () => {
    const res = matchProducts(reqs, [productB]);
    const mb = res.matches.find((m) => m.product.id === "b")!;
    expect(mb.score).toBe(0);
    expect(mb.missing).toEqual(expect.arrayContaining(["ce", "ip", "cri"]));
    expect(res.perfect).toBe(false);
  });

  it("still returns a best (ranked fallback) when nothing is perfect", () => {
    const res = matchProducts(reqs, [productB]);
    expect(res.best?.product.id).toBe("b");
  });

  it("returns null best for an empty candidate list", () => {
    const res = matchProducts(reqs, []);
    expect(res.best).toBeNull();
    expect(res.matches).toEqual([]);
  });
});
