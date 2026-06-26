// Spec assistant domain types.

export interface SpecContext {
  category: string; // real catalogue category id (v1: pavimentos | iluminacao-led | portas)
  building: string; // housing | hotel | office | retail | hospital
  location: string; // interior_dry | interior_wet | exterior_covered | exterior_open | facade
  conditions: string[]; // water | uv | marine | traffic | public | chemicals
  durabilityYears: number; // 10 | 20 | 30 | 40
}

export interface MatchSpec {
  field: string; // dot path into a Product, e.g. "shared_specs.ip_rating" | "compliance.ce"
  op: "gte" | "present" | "eq";
  value?: number | string;
}

export interface Requirement {
  key: string;
  labelKey: string; // i18n key for the requirement label
  value: string; // technical literal (e.g. "IP67", "R11", "EN 14411") or "" when only mandatory matters
  mandatory: boolean;
  match?: MatchSpec; // how to test a product against this requirement (optional)
}
