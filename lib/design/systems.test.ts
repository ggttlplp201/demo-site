import { describe, it, expect } from "vitest";
import { composeSolution, SPACES, PROJECTS } from "./systems";
import type { Product } from "@/lib/types";

const ip = (n: number) => ({ shared_specs: { ip_rating: n }, compliance: { ce: { value: "CE" } } });
const fake: Record<string, Product[]> = {
  pavimentos: [{ id: "floor-a", category: "pavimentos", ...ip(66) } as unknown as Product],
  "iluminacao-led": [{ id: "light-a", category: "iluminacao-led", ...ip(67) } as unknown as Product],
  espelhos: [{ id: "mirror-a", category: "espelhos", ...ip(20) } as unknown as Product],
  drenagem: [{ id: "drain-a", category: "drenagem", ...ip(20) } as unknown as Product],
};
const get = (cat: string) => fake[cat] ?? [];

describe("composeSolution", () => {
  it("maps a bathroom to its building systems with the right categories", () => {
    const sol = composeSolution({ project: "hotel", space: "bathroom", tier: "standard", performance: [] }, get);
    expect(sol.systems.map((s) => s.key)).toEqual(["floor", "wall", "lighting", "mirror", "drainage"]);
    expect(sol.systems.find((s) => s.key === "lighting")?.category).toBe("iluminacao-led");
  });

  it("slots the matched product per system from its category", () => {
    const sol = composeSolution({ project: "hotel", space: "bathroom", tier: "standard", performance: [] }, get);
    expect(sol.systems.find((s) => s.key === "floor")?.product?.id).toBe("floor-a");
    expect(sol.systems.find((s) => s.key === "lighting")?.product?.id).toBe("light-a");
  });

  it("returns a null product when the category has no candidates", () => {
    const sol = composeSolution({ project: "hotel", space: "lobby", tier: "standard", performance: [] }, get);
    // lobby includes a 'door' (portas) system; fake has no portas products
    expect(sol.systems.find((s) => s.key === "door")?.product).toBeNull();
  });

  it("formats a per-system demo budget that scales with tier", () => {
    const std = composeSolution({ project: "hotel", space: "bathroom", tier: "standard", performance: [] }, get);
    const lux = composeSolution({ project: "hotel", space: "bathroom", tier: "luxury", performance: [] }, get);
    const floorStd = std.systems.find((s) => s.key === "floor")!;
    const floorLux = lux.systems.find((s) => s.key === "floor")!;
    expect(floorStd.budget).toMatch(/€\d+–\d+ \/ m²/);
    // luxury tier is pricier than standard
    const hiOf = (s: string) => Number(s.match(/–(\d+)/)![1]);
    expect(hiOf(floorLux.budget)).toBeGreaterThan(hiOf(floorStd.budget));
  });

  it("carries a synthesized context so the UI can build the spec package", () => {
    const sol = composeSolution({ project: "hotel", space: "bathroom", tier: "standard", performance: ["uv"] }, get);
    const floor = sol.systems.find((s) => s.key === "floor")!;
    expect(floor.ctx.category).toBe("pavimentos");
    expect(floor.ctx.building).toBe("hotel");
    expect(floor.ctx.conditions).toEqual(expect.arrayContaining(["water", "uv"])); // bathroom base + chosen
  });

  it("exposes the catalogues of projects and spaces for the UI", () => {
    expect(PROJECTS).toContain("hotel");
    expect(SPACES).toContain("bathroom");
  });
});
