// Design assistant: compose a project/space into building "system solutions", each backed by a
// real catalogue product via the existing spec rules/match engine. Demo-grade budgets are seeded.
// The PDF (DM.pdf) is the general direction; the step model here is adapted to our catalogue.

import { deriveRequirements } from "@/lib/spec/rules";
import { matchProducts } from "@/lib/spec/match";
import type { SpecContext, Requirement } from "@/lib/spec/types";
import type { Product } from "@/lib/types";

export type Tier = "luxury" | "standard" | "budget";

export const PROJECTS = ["hotel", "residential", "office", "commercial", "hospital"];
export const SPACES = ["bathroom", "lobby", "guestroom", "facade", "kitchen", "circulation"];
// performance chips reuse the spec assistant's condition vocabulary so they feed the engine directly
export const PERFORMANCE = ["water", "uv", "marine", "traffic", "public", "chemicals"];
export const TIERS: Tier[] = ["budget", "standard", "luxury"];

export interface DesignInput {
  project: string;
  space: string;
  tier: Tier;
  performance: string[];
}

export interface ComposedSystem {
  key: string; // i18n: design.sys.<key>
  category: string;
  budget: string; // demo range, e.g. "€60–130 / m²"
  product: Product | null;
  ctx: SpecContext;
  requirements: Requirement[];
  satisfied: string[];
  perfect: boolean;
}

export interface DesignSolution {
  input: DesignInput;
  systems: ComposedSystem[];
}

// Which building systems each space comprises, and the catalogue category that fills each slot.
const SPACE_SYSTEMS: Record<string, { key: string; category: string }[]> = {
  bathroom: [
    { key: "floor", category: "pavimentos" },
    { key: "wall", category: "pavimentos" },
    { key: "lighting", category: "iluminacao-led" },
    { key: "mirror", category: "espelhos" },
    { key: "drainage", category: "drenagem" },
  ],
  lobby: [
    { key: "floor", category: "pavimentos" },
    { key: "lighting", category: "iluminacao-led" },
    { key: "door", category: "portas" },
    { key: "metalwork", category: "serralharia" },
  ],
  guestroom: [
    { key: "floor", category: "pavimentos" },
    { key: "skirting", category: "rodapes" },
    { key: "lighting", category: "iluminacao-led" },
    { key: "door", category: "portas" },
    { key: "carpentry", category: "carpintaria" },
  ],
  facade: [
    { key: "cladding", category: "serralharia" },
    { key: "lighting", category: "iluminacao-led" },
    { key: "drainage", category: "drenagem" },
  ],
  kitchen: [
    { key: "floor", category: "pavimentos" },
    { key: "carpentry", category: "carpintaria" },
    { key: "lighting", category: "iluminacao-led" },
  ],
  circulation: [
    { key: "floor", category: "pavimentos" },
    { key: "lighting", category: "iluminacao-led" },
    { key: "skirting", category: "rodapes" },
  ],
};

// Default site context per space (feeds the rules engine).
const SPACE_CTX: Record<string, { location: string; conditions: string[] }> = {
  bathroom: { location: "interior_wet", conditions: ["water"] },
  lobby: { location: "interior_dry", conditions: ["traffic", "public"] },
  guestroom: { location: "interior_dry", conditions: [] },
  facade: { location: "facade", conditions: ["uv", "water"] },
  kitchen: { location: "interior_wet", conditions: ["water"] },
  circulation: { location: "interior_dry", conditions: ["traffic", "public"] },
};

// Map the wizard's project vocabulary onto the rules engine's building vocabulary.
const PROJECT_BUILDING: Record<string, string> = { residential: "housing", commercial: "retail" };

const TIER_YEARS: Record<Tier, number> = { budget: 10, standard: 20, luxury: 40 };
const TIER_FACTOR: Record<Tier, number> = { budget: 0.85, standard: 1.0, luxury: 1.45 };

// Demo budget bands per system (per unit, before tier factor).
const SYSTEM_BUDGET: Record<string, [number, number]> = {
  floor: [60, 130],
  wall: [55, 120],
  cladding: [140, 420],
  lighting: [40, 110],
  mirror: [90, 240],
  drainage: [35, 80],
  door: [180, 520],
  skirting: [12, 35],
  carpentry: [150, 600],
  metalwork: [120, 480],
};
const SYSTEM_UNIT: Record<string, string> = { floor: "m²", wall: "m²", cladding: "m²", skirting: "m" };

function budgetString(key: string, tier: Tier): string {
  const [lo, hi] = SYSTEM_BUDGET[key] ?? [50, 150];
  const f = TIER_FACTOR[tier];
  const unit = SYSTEM_UNIT[key] ?? "un";
  return `€${Math.round(lo * f)}–${Math.round(hi * f)} / ${unit}`;
}

export function composeSolution(
  input: DesignInput,
  getProductsByCategory: (categoryId: string) => Product[],
): DesignSolution {
  const base = SPACE_CTX[input.space] ?? { location: "interior_dry", conditions: [] };
  const slots = SPACE_SYSTEMS[input.space] ?? [];

  const systems: ComposedSystem[] = slots.map((slot) => {
    const ctx: SpecContext = {
      category: slot.category,
      building: PROJECT_BUILDING[input.project] ?? input.project,
      location: base.location,
      conditions: Array.from(new Set([...base.conditions, ...input.performance])),
      durabilityYears: TIER_YEARS[input.tier],
    };
    const requirements = deriveRequirements(ctx);
    const match = matchProducts(requirements, getProductsByCategory(slot.category));
    return {
      key: slot.key,
      category: slot.category,
      budget: budgetString(slot.key, input.tier),
      product: match.best?.product ?? null,
      ctx,
      requirements,
      satisfied: match.best?.satisfied ?? [],
      perfect: match.perfect,
    };
  });

  return { input, systems };
}
