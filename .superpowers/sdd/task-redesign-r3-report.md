# Task Report: Catalogue Redesign R3

## Status: DONE

## Commit
- `891301e` feat: redesign catalogue listing (sidebar, density, redesigned cards)

## What Changed

### lib/filter.ts
- Added `format: string[]` to `CatalogueFilters` interface
- Added format filter logic to `filterProducts`: a product passes if `f.format` is empty OR any of its `bim_assets` formats matches. Used `?? []` fallback for backward compatibility with existing tests that pass filters without `format`.

### lib/i18n.ts
- Added 8 new translation keys to all three locales (pt/en/zh):
  - `cat.density.spacious`, `cat.density.balanced`, `cat.density.dense`
  - `cat.allProducts`, `card.comparing`, `cat.fileLabel`, `facet.format`, `cat.clear`

### components/catalogue/FilterSidebar.tsx
- Complete rework: new sticky sidebar with category checkboxes (showing product counts), format chips (IFC/RFA/DWG/SKP/PDF), power/IP/colorTemp chips, and a clear-all button that appears when any filter is active.

### components/catalogue/CatalogueView.tsx
- Complete rework: removed SearchBar, added density segmented control (spacious/balanced/dense), new grid layout with `lg:grid-cols-[276px_1fr]`, `EMPTY_FILTERS` now includes `format: []`.

### components/catalogue/ProductCard.tsx
- Complete rebuild: outer element is now a `<Link>` (not a div), added compare pill overlay, spec chips, file format row, new card footer with compare + download icon-only buttons. Removed SaveButton and formatPrice dependencies.

### components/catalogue/SortDropdown.tsx
- Restyled: `h-[38px]` select with chevron SVG overlay.

### components/catalogue/DownloadMenu.tsx
- Added optional `iconOnly?: boolean` prop. When true, renders a compact `w-[34px] h-[34px] bg-[#17181C]` icon button. Existing behavior (with text) unchanged when `iconOnly` is false/undefined.

### New Test Files
- `components/catalogue/FilterSidebar.test.tsx` — 6 tests covering heading, format chips, toggle, clear button visibility and behavior
- `components/catalogue/CatalogueView.test.tsx` — 3 smoke tests covering density control, heading, and active state
- `components/catalogue/ProductCard.test.tsx` — Updated to match new Link-based card structure

## Test Results
- **129 tests passing** across 32 test files
- 1 flaky OOM worker crash (infra-level, not a test failure — pre-existing in this environment)
- All existing DownloadMenu tests continue to pass

## Build
- `next build` completed successfully
- TypeScript check passed
- 56 static pages generated

## Notes
- The `filterProducts` format check uses `(f.format ?? [])` to stay backward compatible with existing tests that don't include `format` in their filter objects.
- The DownloadMenu test queries `getByRole("button", { name: /下载/i })` which still works because the default (non-iconOnly) trigger shows the download text.
