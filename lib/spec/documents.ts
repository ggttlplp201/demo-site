// Generate the specification package (caderno de encargos, bill of quantities, BIM
// parameters) from {context, product, requirements} in pt/en/zh. Pure. Requirement labels
// come from the i18n dict (translate); the prose scaffolding is per-locale here so each
// language reads naturally.

import { translate, localizedName, type Locale } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import type { SpecContext, Requirement } from "./types";

export interface SpecPackage {
  caderno: string;
  boq: string;
  bim: [string, string][];
}

const UNIT: Record<string, string> = { pavimentos: "m²", "iluminacao-led": "un", portas: "un" };

function refOf(p: Product): string {
  const first = p.variants?.[0]?.ref;
  if (first && first !== "PLACEHOLDER") return first;
  return p.ref_prefix || p.id;
}

function reqLine(req: Requirement, locale: Locale): string {
  const label = translate(locale, req.labelKey);
  return req.value ? `${label} (${req.value})` : label;
}

function cadernoText(
  locale: Locale,
  p: { name: string; ref: string; loc: string; building: string; reqText: string },
): string {
  if (locale === "pt") {
    return `Fornecimento e aplicação de ${p.name}, referência ${p.ref}, da DoMusMat ou equivalente previamente aprovado pela fiscalização, para aplicação em ${p.loc} em edifício de uso ${p.building}. O produto deverá cumprir os seguintes requisitos obrigatórios: ${p.reqText}. A aplicação deverá respeitar as instruções do fabricante, incluindo todos os acessórios, juntas, remates e fixações necessários ao perfeito acabamento e desempenho.`;
  }
  if (locale === "zh") {
    return `供应并安装 DoMusMat ${p.name}（型号 ${p.ref}），或经监理事先批准的同等产品，用于${p.building}建筑的${p.loc}。产品须满足以下强制性要求：${p.reqText}。安装须遵循制造商说明，包括实现完善饰面与性能所需的所有配件、接缝、收边及固定件。`;
  }
  return `Supply and installation of ${p.name}, reference ${p.ref}, by DoMusMat or an equivalent approved in advance by the project supervision, for application in ${p.loc} in a ${p.building} building. The product must satisfy the following mandatory requirements: ${p.reqText}. Installation shall follow the manufacturer's instructions, including all accessories, joints, trims and fixings necessary for proper finish and performance.`;
}

function boqText(locale: Locale, p: { name: string; ref: string; unit: string }): string {
  if (locale === "pt") {
    return `Fornecimento e aplicação de ${p.name}, DoMusMat ref. ${p.ref}, incluindo preparação de suporte, peças especiais, cortes, juntas, remates e todos os acessórios necessários. Unidade: ${p.unit}.`;
  }
  if (locale === "zh") {
    return `供应并安装 ${p.name}，DoMusMat 型号 ${p.ref}，包括基层处理、特殊配件、切割、接缝、收边及所有必要配件。单位：${p.unit}。`;
  }
  return `Supply and installation of ${p.name}, DoMusMat ref. ${p.ref}, including substrate preparation, special pieces, cuts, joints, trims and all necessary accessories. Unit: ${p.unit}.`;
}

function buildBim(product: Product, ref: string, requirements: Requirement[]): [string, string][] {
  const bim: [string, string][] = [
    ["DM_Reference", ref],
    ["Category", product.category],
  ];
  const ip = (product.shared_specs as Record<string, unknown>)?.["ip_rating"];
  if (ip != null) bim.push(["IP_Rating", `IP${ip}`]);
  for (const r of requirements.filter((r) => r.mandatory && r.value)) bim.push([r.key, r.value]);
  bim.push(["BIM_Formats", "RFA, GSM, IFC, SKP"]);
  return bim;
}

export function buildSpecPackage(
  ctx: SpecContext,
  product: Product,
  requirements: Requirement[],
  locale: Locale,
): SpecPackage {
  const name = localizedName(product, locale);
  const ref = refOf(product);
  const unit = UNIT[ctx.category] ?? "un";
  const loc = translate(locale, `spec.loc.${ctx.location}`);
  const building = translate(locale, `spec.build.${ctx.building}`);
  const reqText = requirements
    .filter((r) => r.mandatory)
    .map((r) => reqLine(r, locale))
    .join("; ");

  return {
    caderno: cadernoText(locale, { name, ref, loc, building, reqText }),
    boq: boqText(locale, { name, ref, unit }),
    bim: buildBim(product, ref, requirements),
  };
}
