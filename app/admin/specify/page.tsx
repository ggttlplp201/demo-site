"use client";

import { useMemo, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { useCatalogue } from "@/state/catalogue";
import { useT, useLocale } from "@/state/locale";
import { translate, localizedName } from "@/lib/i18n";
import { hasRealValue } from "@/lib/placeholder";
import { deriveRequirements, SPEC_CATEGORIES } from "@/lib/spec/rules";
import { matchProducts, type MatchResult } from "@/lib/spec/match";
import { buildSpecPackage, type SpecPackage } from "@/lib/spec/documents";
import type { SpecContext, Requirement } from "@/lib/spec/types";

const BUILDINGS = ["housing", "hotel", "office", "retail", "hospital"];
const LOCATIONS = ["interior_dry", "interior_wet", "exterior_covered", "exterior_open", "facade"];
const CONDITIONS = ["water", "uv", "marine", "traffic", "public", "chemicals"];
const DURABILITIES = [10, 20, 30, 40];

type Result = { ctx: SpecContext; requirements: Requirement[]; match: MatchResult; pkg: SpecPackage | null };
type Tab = "caderno" | "boq" | "bim";

const fieldCls = "w-full rounded border border-aluminium bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink";
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-aluminium-dark mt-4 mb-1";

export default function SpecifyPage() {
  const t = useT();
  const { locale } = useLocale();
  const repo = useCatalogue();

  const specCategories = useMemo(
    () => repo.getCategories().filter((c) => SPEC_CATEGORIES.includes(c.id)),
    [repo],
  );

  const [category, setCategory] = useState(specCategories[0]?.id ?? SPEC_CATEGORIES[0]);
  const [building, setBuilding] = useState("hotel");
  const [location, setLocation] = useState("exterior_open");
  const [conditions, setConditions] = useState<string[]>(["water", "uv"]);
  const [durability, setDurability] = useState(20);
  const [result, setResult] = useState<Result | null>(null);
  const [tab, setTab] = useState<Tab>("caderno");
  const [copied, setCopied] = useState<string | null>(null);

  function toggleCond(c: string) {
    setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function generate() {
    const ctx: SpecContext = { category, building, location, conditions, durabilityYears: durability };
    const requirements = deriveRequirements(ctx);
    const candidates = repo.getProductsByCategory(category);
    const match = matchProducts(requirements, candidates);
    const pkg = match.best ? buildSpecPackage(ctx, match.best.product, requirements, locale) : null;
    setResult({ ctx, requirements, match, pkg });
    setTab("caderno");
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500);
  }

  function exportPdf() {
    if (!result?.pkg || !result.match.best) return;
    const p = result.match.best.product;
    const name = localizedName(p, locale);
    const bimRows = result.pkg.bim.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${name}</title>
      <style>body{font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#1f2428;max-width:760px;margin:32px auto;padding:0 24px}
      h1{font-size:22px}h2{font-size:15px;margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:4px}
      .ref{font-family:monospace;background:#f4f1ea;padding:4px 8px;border-radius:6px;display:inline-block}
      table{border-collapse:collapse;width:100%}td{border:1px solid #e5e5e5;padding:6px 10px}</style></head>
      <body><h1>DoMusMat — ${name}</h1><p class="ref">${result.pkg.bim.find(([k]) => k === "DM_Reference")?.[1] ?? ""}</p>
      <h2>${t("spec.tab.caderno")}</h2><p>${result.pkg.caderno}</p>
      <h2>${t("spec.tab.boq")}</h2><p>${result.pkg.boq}</p>
      <h2>${t("spec.tab.bim")}</h2><table>${bimRows}</table></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  const best = result?.match.best ?? null;
  const product = best?.product ?? null;

  return (
    <AdminGate title={t("spec.nav")}>
      <p className="mb-6 max-w-3xl text-sm text-aluminium-dark">{t("spec.intro")}</p>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* Questions */}
        <aside className="rounded-xl border border-aluminium bg-neutral-fill p-5">
          <label className={labelCls}>{t("spec.q.category")}</label>
          <select className={fieldCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            {specCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {localizedName(c, locale)}
              </option>
            ))}
          </select>

          <label className={labelCls}>{t("spec.q.building")}</label>
          <select className={fieldCls} value={building} onChange={(e) => setBuilding(e.target.value)}>
            {BUILDINGS.map((b) => (
              <option key={b} value={b}>
                {t(`spec.build.${b}`)}
              </option>
            ))}
          </select>

          <label className={labelCls}>{t("spec.q.location")}</label>
          <select className={fieldCls} value={location} onChange={(e) => setLocation(e.target.value)}>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {t(`spec.loc.${l}`)}
              </option>
            ))}
          </select>

          <label className={labelCls}>{t("spec.q.conditions")}</label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map((c) => (
              <label key={c} className="flex items-center gap-2 rounded border border-aluminium bg-white px-2 py-1.5 text-xs text-ink">
                <input type="checkbox" checked={conditions.includes(c)} onChange={() => toggleCond(c)} />
                {t(`spec.cond.${c}`)}
              </label>
            ))}
          </div>

          <label className={labelCls}>{t("spec.q.durability")}</label>
          <select className={fieldCls} value={durability} onChange={(e) => setDurability(Number(e.target.value))}>
            {DURABILITIES.map((d) => (
              <option key={d} value={d}>
                {d} {t("spec.years")}
              </option>
            ))}
          </select>

          <button onClick={generate} className="mt-5 w-full rounded bg-ink px-4 py-2.5 text-sm font-semibold text-white">
            {t("spec.generate")}
          </button>
        </aside>

        {/* Results */}
        <section className="space-y-6">
          {!result ? (
            <p className="text-aluminium-dark">—</p>
          ) : !product ? (
            <p className="text-aluminium-dark">{t("spec.noMatch")}</p>
          ) : (
            <>
              {/* Recommended */}
              <div className="rounded-xl border border-aluminium p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-brand">{t("spec.recommended")}</div>
                <h2 className="mt-1 text-xl font-bold text-ink">{localizedName(product, locale)}</h2>
                <span className="mt-2 inline-block rounded bg-ink px-2 py-1 font-mono text-xs text-white">
                  {result.pkg?.bim.find(([k]) => k === "DM_Reference")?.[1]}
                </span>
                <div className="mt-3 text-sm text-aluminium-dark">
                  {best!.score}/{best!.testable} {t("spec.satisfies")}
                </div>
                {!result.match.perfect && <p className="mt-2 text-xs text-amber-600">{t("spec.thinData")}</p>}
              </div>

              {/* Requirements */}
              <div className="rounded-xl border border-aluminium p-5">
                <h3 className="mb-3 text-base font-semibold text-ink">{t("spec.requirements")}</h3>
                <ul className="space-y-2">
                  {result.requirements.map((r) => {
                    const met = best!.satisfied.includes(r.key);
                    const testable = !!r.match;
                    return (
                      <li key={r.key} className="flex items-center justify-between gap-3 border-b border-neutral-fill pb-2 text-sm">
                        <span className="text-ink">
                          {translate(locale, r.labelKey)}
                          {r.value ? ` (${r.value})` : ""}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className={`text-xs ${r.mandatory ? "text-ink" : "text-aluminium-dark"}`}>
                            {r.mandatory ? t("spec.req.mandatory") : t("spec.req.recommended")}
                          </span>
                          {testable && (
                            <span className={met ? "text-emerald-600" : "text-red-500"}>{met ? "✓" : "✗"}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Package */}
              {result.pkg && (
                <div className="rounded-xl border border-aluminium p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-ink">{t("spec.package")}</h3>
                    <button onClick={exportPdf} className="rounded border border-aluminium px-3 py-1.5 text-xs font-medium text-ink">
                      ↧ {t("spec.print")}
                    </button>
                  </div>
                  <div className="mb-3 flex gap-2">
                    {(["caderno", "boq", "bim"] as Tab[]).map((tb) => (
                      <button
                        key={tb}
                        onClick={() => setTab(tb)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          tab === tb ? "bg-ink text-white" : "border border-aluminium text-ink"
                        }`}
                      >
                        {t(`spec.tab.${tb}`)}
                      </button>
                    ))}
                  </div>

                  {tab !== "bim" ? (
                    <>
                      <p className="whitespace-pre-wrap rounded border border-aluminium bg-white p-4 text-sm leading-relaxed text-ink">
                        {tab === "caderno" ? result.pkg.caderno : result.pkg.boq}
                      </p>
                      <button
                        onClick={() => copy(tab === "caderno" ? result.pkg!.caderno : result.pkg!.boq, tab)}
                        className="mt-3 rounded border border-aluminium px-3 py-1.5 text-xs font-medium text-ink"
                      >
                        {copied === tab ? t("spec.copied") : t("spec.copy")}
                      </button>
                    </>
                  ) : (
                    <div className="overflow-hidden rounded border border-aluminium bg-white">
                      <table className="w-full text-sm">
                        <tbody>
                          {result.pkg.bim.map(([k, v]) => (
                            <tr key={k} className="border-b border-neutral-fill">
                              <td className="px-3 py-2 font-mono text-xs text-aluminium-dark">{k}</td>
                              <td className="px-3 py-2 text-ink">{v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Downloads */}
                  {product.bim_assets && product.bim_assets.length > 0 && (
                    <div className="mt-5">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-aluminium-dark">
                        {t("spec.downloads")}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.bim_assets.map((a, i) => {
                          const ok = hasRealValue(a.file);
                          return (
                            <span
                              key={i}
                              className={`rounded border px-3 py-1.5 text-xs ${
                                ok ? "border-ink text-ink" : "border-aluminium text-aluminium-dark"
                              }`}
                            >
                              {a.format}
                              {!ok ? ` · ${t("spec.unavailable")}` : ""}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </AdminGate>
  );
}
