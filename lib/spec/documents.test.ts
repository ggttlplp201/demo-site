import { describe, it, expect } from "vitest";
import { buildSpecPackage } from "./documents";
import { deriveRequirements } from "./rules";
import type { SpecContext } from "./types";
import type { Product } from "@/lib/types";

const ctx: SpecContext = {
  category: "iluminacao-led",
  building: "hotel",
  location: "exterior_open",
  conditions: ["water", "marine"],
  durabilityYears: 20,
};

const product = {
  id: "bollard",
  category: "iluminacao-led",
  name: "Balizador",
  name_en: "Garden Bollard",
  name_zh: "花园灯柱",
  ref_prefix: "DMSL-",
  variants: [{ ref: "DMSL-12W004", attrs: {} }],
  shared_specs: { ip_rating: 65 },
  compliance: {},
  bim_metadata: {},
  bim_assets: [],
} as unknown as Product;

describe("buildSpecPackage", () => {
  const reqs = deriveRequirements(ctx);

  it("caderno (en) names the product, ref and a mandatory requirement value", () => {
    const pkg = buildSpecPackage(ctx, product, reqs, "en");
    expect(pkg.caderno).toContain("Garden Bollard");
    expect(pkg.caderno).toContain("DMSL-12W004");
    expect(pkg.caderno).toContain("IP67"); // water+exterior mandatory requirement
    expect(pkg.caderno).toContain("DoMusMat");
  });

  it("localizes the product name per locale", () => {
    expect(buildSpecPackage(ctx, product, reqs, "pt").caderno).toContain("Balizador");
    expect(buildSpecPackage(ctx, product, reqs, "zh").caderno).toContain("花园灯柱");
  });

  it("BoQ references the SKU and uses the per-category unit", () => {
    const lighting = buildSpecPackage(ctx, product, reqs, "en");
    expect(lighting.boq).toContain("DMSL-12W004");
    expect(lighting.boq).toContain("un");

    const floor = buildSpecPackage({ ...ctx, category: "pavimentos" }, { ...product, category: "pavimentos" } as Product, reqs, "en");
    expect(floor.boq).toContain("m²");
  });

  it("BIM params include DM_Reference = the SKU", () => {
    const pkg = buildSpecPackage(ctx, product, reqs, "en");
    const ref = pkg.bim.find(([k]) => k === "DM_Reference");
    expect(ref?.[1]).toBe("DMSL-12W004");
  });

  it("falls back to ref_prefix/id when the first variant ref is PLACEHOLDER", () => {
    const noRef = { ...product, variants: [{ ref: "PLACEHOLDER", attrs: {} }] } as unknown as Product;
    const pkg = buildSpecPackage(ctx, noRef, reqs, "en");
    expect(pkg.bim.find(([k]) => k === "DM_Reference")?.[1]).toBe("DMSL-");
  });
});
