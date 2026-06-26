import { describe, it, expect } from "vitest";
import { deriveRequirements } from "./rules";
import type { SpecContext } from "./types";

const ctx = (over: Partial<SpecContext>): SpecContext => ({
  category: "iluminacao-led",
  building: "hotel",
  location: "exterior_open",
  conditions: [],
  durabilityYears: 20,
  ...over,
});

describe("deriveRequirements", () => {
  it("always requires CE marking, for any category", () => {
    for (const category of ["iluminacao-led", "pavimentos", "portas"]) {
      const keys = deriveRequirements(ctx({ category })).map((r) => r.key);
      expect(keys).toContain("ce");
    }
  });

  it("lighting outdoors requires IP65, bumped to IP67 with water, plus marine corrosion", () => {
    const dry = deriveRequirements(ctx({ category: "iluminacao-led", conditions: [] }));
    expect(dry.find((r) => r.key === "ip")?.value).toBe("IP65");

    const wet = deriveRequirements(ctx({ category: "iluminacao-led", conditions: ["water", "marine"] }));
    expect(wet.find((r) => r.key === "ip")?.value).toBe("IP67");
    expect(wet.map((r) => r.key)).toContain("corrosion");
    expect(wet.find((r) => r.key === "ik")?.value).toBe("IK10"); // marine -> IK10
  });

  it("flooring outdoors with traffic requires DoP, EN norm, slip R11 and frost resistance", () => {
    const reqs = deriveRequirements(ctx({ category: "pavimentos", conditions: ["traffic"] }));
    const keys = reqs.map((r) => r.key);
    expect(keys).toEqual(expect.arrayContaining(["ce", "dop", "norm", "slip", "frost"]));
    expect(reqs.find((r) => r.key === "slip")?.value).toBe("R11");
  });

  it("doors in a hospital with public access require fire rating and acoustic performance", () => {
    const reqs = deriveRequirements(ctx({ category: "portas", building: "hospital", location: "interior_dry", conditions: ["public"] }));
    const keys = reqs.map((r) => r.key);
    expect(keys).toEqual(expect.arrayContaining(["ce", "fire", "acoustic"]));
  });

  it("returns no duplicate requirement keys", () => {
    const reqs = deriveRequirements(ctx({ category: "iluminacao-led", conditions: ["water", "marine", "traffic", "public"] }));
    const keys = reqs.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("marks mandatory requirements as mandatory", () => {
    const ce = deriveRequirements(ctx({})).find((r) => r.key === "ce");
    expect(ce?.mandatory).toBe(true);
  });
});
