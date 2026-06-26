// Auto-match: score catalogue products against derived requirements by their real spec
// fields. Returns a ranked list with a best-partial fallback when nothing fully qualifies
// (expected while catalogue specs are still PLACEHOLDER-heavy).

import { hasRealValue } from "@/lib/placeholder";
import type { Product } from "@/lib/types";
import type { Requirement } from "./types";

export interface ProductMatch {
  product: Product;
  satisfied: string[];
  missing: string[];
  untestable: string[];
  score: number;
  testable: number;
}

export interface MatchResult {
  matches: ProductMatch[]; // best-first
  best: ProductMatch | null;
  perfect: boolean; // best satisfies every testable requirement
}

function resolveField(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((acc, k) => (acc == null ? undefined : (acc as Record<string, unknown>)[k]), obj);
}

function satisfies(product: Product, req: Requirement): boolean {
  if (!req.match) return false;
  const v = resolveField(product, req.match.field);
  switch (req.match.op) {
    case "present":
      return hasRealValue(v);
    case "gte": {
      const n = typeof v === "number" ? v : Number(v);
      return !Number.isNaN(n) && n >= Number(req.match.value);
    }
    case "eq":
      return String(v) === String(req.match.value);
    default:
      return false;
  }
}

export function matchProducts(requirements: Requirement[], products: Product[]): MatchResult {
  const testableReqs = requirements.filter((r) => r.match);
  const untestable = requirements.filter((r) => !r.match).map((r) => r.key);

  const matches: ProductMatch[] = products.map((product) => {
    const satisfied: string[] = [];
    const missing: string[] = [];
    for (const req of testableReqs) {
      if (satisfies(product, req)) satisfied.push(req.key);
      else missing.push(req.key);
    }
    return { product, satisfied, missing, untestable, score: satisfied.length, testable: testableReqs.length };
  });

  matches.sort((a, b) => b.score - a.score);
  const best = matches[0] ?? null;
  const perfect = !!best && best.testable > 0 && best.score === best.testable;
  return { matches, best, perfect };
}
