// Rules engine: derive mandatory technical requirements from project context.
// v1 covers the three demo archetypes on real categories: pavimentos (ceramic),
// iluminacao-led (lighting), portas (doors). Data-driven and pure; thresholds are
// sensible defaults meant to be refined by the technical team.

import type { SpecContext, Requirement } from "./types";

const isExterior = (loc: string) => loc.startsWith("exterior") || loc === "facade";
const has = (ctx: SpecContext, c: string) => ctx.conditions.includes(c);

function lightingReqs(ctx: SpecContext): Requirement[] {
  const r: Requirement[] = [];
  r.push({ key: "ce", labelKey: "spec.req.ce", value: "CE", mandatory: true, match: { field: "compliance.ce.value", op: "present" } });
  if (isExterior(ctx.location)) {
    const ip = has(ctx, "water") ? "IP67" : "IP65";
    r.push({ key: "ip", labelKey: "spec.req.ip", value: ip, mandatory: true, match: { field: "shared_specs.ip_rating", op: "gte", value: ip === "IP67" ? 67 : 65 } });
    r.push({ key: "ik", labelKey: "spec.req.ik", value: has(ctx, "marine") ? "IK10" : "IK08", mandatory: false });
  }
  if (has(ctx, "marine")) r.push({ key: "corrosion", labelKey: "spec.req.corrosion", value: "", mandatory: true });
  r.push({ key: "cri", labelKey: "spec.req.cri", value: "≥80", mandatory: false, match: { field: "shared_specs.cri", op: "present" } });
  r.push({ key: "driver", labelKey: "spec.req.driver", value: "", mandatory: false });
  r.push({ key: "lifetime", labelKey: "spec.req.lifetime", value: "≥50000h", mandatory: false });
  r.push({ key: "warranty", labelKey: "spec.req.warranty", value: ctx.durabilityYears >= 30 ? "≥7" : "≥5", mandatory: false });
  return r;
}

function flooringReqs(ctx: SpecContext): Requirement[] {
  const r: Requirement[] = [];
  r.push({ key: "ce", labelKey: "spec.req.ce", value: "CE", mandatory: true, match: { field: "compliance.ce.value", op: "present" } });
  r.push({ key: "dop", labelKey: "spec.req.dop", value: "", mandatory: true, match: { field: "compliance.dop.value", op: "present" } });
  r.push({ key: "norm", labelKey: "spec.req.norm.ceramic", value: "EN 14411", mandatory: true });
  const wet = isExterior(ctx.location) || ctx.location === "interior_wet" || has(ctx, "water");
  if (isExterior(ctx.location) || has(ctx, "uv")) {
    r.push({ key: "frost", labelKey: "spec.req.frost", value: "", mandatory: true });
    r.push({ key: "uv", labelKey: "spec.req.uv", value: "", mandatory: true });
    r.push({ key: "absorption", labelKey: "spec.req.absorption", value: "≤0,5%", mandatory: true });
  }
  if (has(ctx, "traffic")) {
    r.push({ key: "slip", labelKey: "spec.req.slip", value: "R11", mandatory: true });
    r.push({ key: "abrasion", labelKey: "spec.req.abrasion", value: "", mandatory: true });
  } else if (wet || has(ctx, "public")) {
    r.push({ key: "slip", labelKey: "spec.req.slip", value: "R10", mandatory: true });
  }
  if (ctx.durabilityYears >= 10) r.push({ key: "warranty", labelKey: "spec.req.warranty", value: "≥10", mandatory: false });
  return r;
}

function doorReqs(ctx: SpecContext): Requirement[] {
  const r: Requirement[] = [];
  r.push({ key: "ce", labelKey: "spec.req.ce", value: "CE", mandatory: true, match: { field: "compliance.ce.value", op: "present" } });
  r.push({ key: "dop", labelKey: "spec.req.dop", value: "", mandatory: true, match: { field: "compliance.dop.value", op: "present" } });
  if (["hospital", "hotel", "office", "retail"].includes(ctx.building)) {
    r.push({ key: "fire", labelKey: "spec.req.fire", value: "EI30", mandatory: true });
    r.push({ key: "norm", labelKey: "spec.req.norm.fire", value: "EN 1634", mandatory: true });
  }
  if (has(ctx, "public")) r.push({ key: "acoustic", labelKey: "spec.req.acoustic", value: "", mandatory: true, match: { field: "compliance.acoustic.value", op: "present" } });
  if (isExterior(ctx.location)) r.push({ key: "weather", labelKey: "spec.req.weather", value: "", mandatory: true });
  if (ctx.durabilityYears >= 10) r.push({ key: "warranty", labelKey: "spec.req.warranty", value: "≥5", mandatory: false });
  return r;
}

/** Supported categories with seeded v1 rules. */
export const SPEC_CATEGORIES = ["pavimentos", "iluminacao-led", "portas"];

export function deriveRequirements(ctx: SpecContext): Requirement[] {
  let list: Requirement[];
  switch (ctx.category) {
    case "pavimentos":
      list = flooringReqs(ctx);
      break;
    case "portas":
      list = doorReqs(ctx);
      break;
    case "iluminacao-led":
    default:
      list = lightingReqs(ctx);
      break;
  }
  const seen = new Set<string>();
  return list.filter((r) => (seen.has(r.key) ? false : (seen.add(r.key), true)));
}
