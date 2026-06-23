# Redesign Fix Report

## Fixes Applied

1. **Card download popover clipped** — Already fixed (router.push was already in place). No DownloadMenu import in ProductCard. Confirmed.

2. **File-format badge row wrap** — Removed the 4-badge cap. `getFormats()` now returns all sorted formats. Row layout: `文件` label is `flex-none` top-left; badges live in a sibling `flex flex-wrap gap-1` container so extras flow to additional rows. ProductCard test updated accordingly.

3. **Filter sidebar independent scroll** — Added `max-h-[calc(100vh-128px)] overflow-y-auto scrollbar-thin scrollbar-thumb-[#D8D7CF] scrollbar-track-transparent` to the `<aside>` in FilterSidebar.tsx. Position was already `sticky top-[128px] self-start`.

4. **Search bar works** — Nav.tsx: added `useRouter`, `handleSearchSubmit` (prevents default, pushes `/catalogue?q=<term>`), wrapped desktop search in `<form role="search" onSubmit={...}>`, same for mobile MobileMenu (added `onSearchSubmit` prop). CatalogueView.tsx: reads `?q` from `useSearchParams()` into `query` state, syncs in `useEffect`, passes to `filterProducts(allProducts, filters, query)`. Nav.test.tsx updated with `next/navigation` mock.

5. **BIM metadata empty values → "TBD"** — BimMetadataSummary.tsx: replaced `fbSpec = t("fb.spec")` fallback with constant `TBD = "TBD"` for all placeholder fields (dimensions, materials, IFC properties, version). Real values (product_id, 1.0.0, real dimension entries) unchanged. Test updated to expect "TBD" instead of "面议".

6. **Resize 3D model viewer** — ModelViewer.tsx: height changed from `clamp(280px, 45vw, 480px)` to `clamp(240px, 32vw, 380px)`. DetailView.tsx: removed `aspect-square` wrapper class from the model tab container so the viewer's own height clamp drives sizing.

7. **Accessibility sweep** — FilterSidebar already uses real `<input type="checkbox">` in `<label>`. Nav already has `aria-label` on all icon links/buttons, `aria-pressed` on language switch, `aria-expanded` on hamburger. DetailView tabs already use `role="tab"` / `aria-selected` / `role="tablist"`. Density toggle uses `aria-pressed`. Decorative SVGs have `aria-hidden`. Images have `alt={localizedName(...)}`. No faint text on essential content.

8. **Mobile usability** — Desktop sidebar sticky/scroll applies only via the `hidden lg:block` wrapper (mobile renders in the toggle panel as non-sticky). Grids use responsive cols. DetailView stacks to single column on mobile. Nav collapses to hamburger + MobileMenu. Badge rows and download panel wrap naturally. No overflow-x introduced.

## Test / Build

- Tests: **32/33 files pass, 134/137 tests pass** (pre-existing worker OOM from `@google/model-viewer` WebGL import, unrelated to these changes).
- Build: **npm run build succeeds** — 56 static pages, TypeScript clean.

## Concerns

- `scrollbar-thin` / `scrollbar-thumb-*` utilities require the `tailwindcss-scrollbar` plugin for visual effect; sidebar scrolls functionally without it.
- Worker OOM in tests pre-existing.
