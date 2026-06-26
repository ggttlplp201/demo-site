# DB-backed catalogue → admin management → spec assistant

Date: 2026-06-26
Status: approved (decisions locked via brainstorming on 2026-06-26)
Branch base: `demo_site/main` @ 2b93bc0

## Summary

A three-phase program, built A → B → C, each independently shippable:

- **A — Catalogue migration.** Move products / variants / categories into Supabase. Reshape data access from a static bundled JSON read to a DB-backed source, *without* changing the rendered pages. The static `data/product_data.json` becomes the seed and the runtime fallback.
- **B — Admin product management** (`/admin/products`, managers only). Single form + bulk CSV upload + edit (fill in `PLACEHOLDER`/spec fields) + retire.
- **C — Spec assistant** (`/admin/specify`, managers only). A guided prescription tool: project-question form → rules engine derives mandatory technical requirements → auto-matches catalogue products by their real spec fields → generates *caderno de encargos* / bill of quantities / BIM parameters + downloads, in pt/en/zh, with copy + PDF export.

The phases are dependent: C's auto-match is only as good as the catalogue's spec data, which A models and B lets managers fill in. Hence the A → B → C order.

## Decisions (locked)

- **Input for new products:** structured CSV template (bulk) + web form (single). No PDF/Excel-binary parsing.
- **Storage:** full migration of all 47 products into Supabase; swap to a DB-backed repository.
- **Completeness:** lean core required (name, category, ref + key specs, EU standards you have); everything else optional → fallback text / placeholder image / existing `PLACEHOLDER` convention.
- **Variants in CSV:** rows grouped by product slug → first row supplies product fields, each row adds a variant.
- **Manage scope:** add + edit + delete (retire).
- **Spec assistant audience:** internal, managers only, under `/admin/specify`.
- **Product match:** auto-match from catalogue spec fields, with a ranked fallback when specs are thin.
- **Spec output:** copy text + export PDF.
- **Build order:** A → B → C.
- **Rules v1 coverage:** the three demo archetypes mapped to real categories — ceramic→`pavimentos`, lighting→`iluminacao-led`, and `portas` as the third (the demo's sanitary/faucet archetype has no real category; `portas` has rich fire/acoustic/EN-norm requirements that suit a rules engine). Engine is data-driven so more categories are added later.

## Cross-cutting

- **i18n:** full pt/en/zh (zh default) across UI labels, derived requirements, generated prose, and BIM parameter labels. Reuses `lib/i18n.ts` / `useT` / `useLocale` / `localizedName`.
- **Design:** the real DoMusMat system (dark `#141414` / brand palette, existing Nav/Footer/card components). The provided `domusmat_spec_demo.html` is a *functional* blueprint only — its beige palette is discarded.
- **Security:** mirrors the orders model — public SELECT on catalogue tables, **no client write policies**, all writes through manager-gated `SECURITY DEFINER` RPCs that check `is_manager()`.
- **Testing:** TDD for pure logic (transforms, CSV import, slug, rules engine, spec generators). Full `vitest` suite stays green; tsc baseline unchanged.
- **Integration / deploy:** **local-first.** Build each phase on a local branch off fresh `demo_site/main`; user reviews locally (`npm run dev`) and applies the SQL migration in the Supabase dashboard; only after approval do we push additively (`git push demo_site HEAD:main`, never force-moving the shared `main` the other session owns). Vercel deploys only on that approved push.

---

## Phase A — Catalogue migration (detailed)

### Data model — `supabase/migrations/0005_catalogue.sql`

> Note: numbered 0005 because the configurator project already holds `0004_render_jobs.sql` on main.

- **categories** — `id text PK, name, name_en, name_zh text not null, sort_order int default 0`.
- **products** — core queryable columns + jsonb for rich nested blocks:
  - `id text PK` (slug), `category text references categories(id)`,
  - `name, name_en, name_zh, ref_prefix, description_pt, description_en, description_zh text`,
  - `applications text[]`, `images text[]`,
  - `shared_specs, compliance, bim_assets, bim_metadata, standardization, supply_chain jsonb`,
  - `model3d text default 'PLACEHOLDER'`,
  - `status text not null default 'active' check (status in ('active','retired'))`,
  - `sort_order int default 0`, `created_at timestamptz default now()`, `updated_at timestamptz`.
- **product_variants** — `ref text PK, product_id text references products(id) on delete cascade, attrs jsonb not null default '{}', sort_order int default 0`.
- **RLS:** enabled on all three. SELECT: categories + variants `using (true)`; products `using (status = 'active' or public.is_manager())` so the live catalogue shows only active while managers see retired in admin. **No** insert/update/delete policies — writes come in Phase B via RPC; seeding uses the service-role key (bypasses RLS).
- **Trigger:** reuse the `touch_updated_at()` pattern from `0003_orders.sql` on `products`.

### Shared transform — `lib/catalogue/transform.ts` (TDD, pure)

Two pure functions that the seed and the loader both reuse:

- `catalogueToRows(catalogue)` → `{ categories[], products[], variants[] }` (DB row shape).
- `rowsToCatalogue(rows, { manufacturer, commercial })` → `Catalogue` (the exact shape `lib/types.ts` already defines).

**Correctness gate (no DB needed):** round-trip test — `rowsToCatalogue(catalogueToRows(staticCatalogue), staticStatics)` deep-equals the original static `catalogue`. Because the seed and the loader share these functions, this proves the migration renders identically.

### Seed — `scripts/seed_catalogue.mjs`

Node script using the service-role key (read from a local, uncommitted env var — never committed). Reads `data/product_data.json`, runs `catalogueToRows`, upserts categories → products → variants idempotently (upsert on PK). Run locally by the user/me.

### Data access reshape

- **`lib/catalogue/loadCatalogue.ts`** — server-only `async loadCatalogue(): Promise<Catalogue>`, wrapped in React `cache()` (per-request dedupe). Fetches categories, active products, and their variants via a Supabase server read client; runs `rowsToCatalogue`; merges the static `manufacturer` + `commercial` (these are **not** migrated). On any error or missing env, logs a warning and returns the static `catalogue` — the catalogue never goes dark. ISR freshness via route-level `revalidate` (Phase B adds on-write revalidation).
- **`lib/repository.ts`** — rename the class to `InMemoryProductRepository` (behavior unchanged; constructor already takes `Catalogue`). Keep a default static `repo` export built from the static `catalogue` — used as the fallback and by tests.
- **`state/catalogue.tsx`** — `<CatalogueProvider data={Catalogue}>` client context holding `new InMemoryProductRepository(data)`; `useCatalogue(): ProductRepository` returns the context repo, or **falls back to the static `repo`** when no provider is mounted (keeps existing component tests working without wrapping, and is a safety net). Root layout (server) calls `await loadCatalogue()` and passes it to the provider.

### Call-site swap

- Client consumers (~10: `ProductCard`, `CatalogueView`, `FilterSidebar`, `DetailView`, `ComparisonTable`, `Nav`, `OrderCalculator`, `SavedLists`, home `page.tsx`, `downloads`): replace `import { repo }` + `repo.X()` with `const repo = useCatalogue(); repo.X()`. Mechanical; method names identical.
- Server consumers (`app/products/[id]/page.tsx`): `await loadCatalogue()` → build/obtain repo. `app/catalogue/page.tsx` only wraps the client `CatalogueView`.
- `Footer.tsx` uses `repo.getManufacturer()` — manufacturer stays static, so it can keep the static `repo` or read from the provider; either works.

### Verification

- `vitest` round-trip + existing suite green; `tsc` baseline unchanged.
- Local `scripts/verify_catalogue.mjs`: load from the real DB and deep-equal vs static; print any diff.
- `npm run dev`: catalogue grid, filters, a product detail page, downloads, compare, calculator all render identically against DB data. User reviews before any push.

---

## Phase B — Admin product management (outline; detailed at its cycle)

- **RPCs** (`0006_catalogue_writes.sql`, SECURITY DEFINER, `is_manager()`-gated): `upsert_product(payload jsonb)`, `import_products(rows jsonb) returns jsonb` (transactional bulk, per-row result), `set_product_status(id, status)`.
- **Libs (TDD):** `lib/productImport.ts` (CSV text → validated rows, group-by-slug → variants, EU-standard columns → `compliance` jsonb, comma-split images, lean-core validation with per-row errors), `lib/slug.ts` (name → kebab slug, dedupe).
- **UI** (`/admin/products`): product list (all incl. retired) with Add / Bulk upload / Edit / Retire-Restore; single add/edit form (lean-core + optional); bulk flow upload → preview (OK ✓ / errors ✗) → confirm → import → summary; downloadable CSV template.
- On write, revalidate the catalogue (path/tag) so new/edited cards go live.

## Phase C — Spec assistant (outline; detailed at its cycle)

- **Route:** `/admin/specify`, managers only (via `routeAccess`).
- **Question model:** category, building type, location, condition flags (water/UV/marine/traffic/public/chemicals), durability target — adapted to real categories.
- **Rules engine (data-driven, TDD):** `lib/spec/rules.ts` maps context → mandatory requirements (e.g. exterior + marine → IP67 + corrosion resistance + applicable EN norm). v1 seeded for `pavimentos`, `iluminacao-led`, `portas`.
- **Auto-match (TDD):** `lib/spec/match.ts` maps requirement keys → product spec fields (`shared_specs` / variant `attrs` / `compliance`), filters + ranks the catalogue; ranked fallback (best partial match) when nothing fully qualifies, with a clear "thin data" note.
- **Generators (TDD, pt/en/zh):** `lib/spec/documents.ts` builds *caderno de encargos*, bill-of-quantities line, and BIM parameter table from structured parts using per-language sentence templates — not hand-written prose per product.
- **Downloads:** wired to the product's real `bim_assets`; unavailable assets shown as placeholder.
- **Output:** copy each block + export a clean PDF spec package.

## Risks

- **Sync→async reshape (Phase A)** is the main risk — mitigated by keeping the `ProductRepository` interface and `InMemoryProductRepository` unchanged, the `useCatalogue()` static fallback, the static-JSON runtime fallback, and the deep-equal round-trip gate.
- **Auto-match needs real specs** — many catalogue fields are `PLACEHOLDER` today. Mitigated by Phase B (managers fill specs) preceding Phase C, and by the ranked-fallback match.
- **PDF export** approach (server render vs client print-to-PDF) decided at Phase C; default to a print-stylesheet/`window.print` first, server-side generation only if needed.
