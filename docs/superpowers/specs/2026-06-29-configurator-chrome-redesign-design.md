# Configurator chrome redesign — design

Date: 2026-06-29
Status: approved (design), implementation pending
Source: ~/Downloads/3D Room Configurator Nav.zip (HTML handoff + tokens)

## Goal
Replace the configurator's floating UI with the handoff design: a frosted-glass
icon-rail + flyout sidebar, a slim time/lights top bar, a restyled floor-plan
panel, and a model-picker modal with a live, rotatable 3D preview. Single accent
`#1f9d76`, Manrope, tokens per the handoff README.

## Resolved decisions
- **Lights:** the top-bar light-count segment controls the room the camera is
  currently in (auto-detected from the camera tracker), preserving per-zone lights.
- **Navigate:** dropped — Walk/look is the only mode and always active.
- **Item placing:** one shared picker. Opened from an Items-flyout category → on
  "Place in room" it arms the place tool (then click a surface). Opened from an
  in-room slot pill → it fills that slot.
- **Floor plan:** keep our real projected minimap (walls, door-swing arcs, live
  marker); adopt only the design's chrome (frosted panel, eyebrow, collapse
  chevron, footer room label).
- **Picker preview:** a small **rotatable** GLB render (mini three.js canvas +
  OrbitControls reusing FittedModel).
- **Out of scope (not in our app):** Orbit nav mode, solid-colour swatches,
  multiple fixture types (we only have ceiling → drop the "Ceiling" segment;
  keep "Cones" as the light-helper toggle).

## Components (new `components/configurator/chrome/`)
- `ToolRail.tsx` — 56px frosted icon rail (Materials / Items / Actions); manages
  which flyout is open (one at a time; click active = close).
- `ToolFlyout.tsx` — 300px frosted flyout; renders content by active tool:
  - Materials: horizontal swatch strip of the 4 textured materials → arms paint.
  - Items: category rows Door / Storage / Table (Storage groups cabinet+wardrobe
    +dresser; Door groups door+metal-door) with option counts → open picker.
  - Actions: Save & copy link + Photoreal walkthrough (existing handlers).
- `TopBar.tsx` — sun · time slider (our 6–20 range) · time label · divider ·
  light-count segment (Off/1/3/6/9, current room) · Cones toggle.
- `ModelPicker.tsx` — two-pane modal: left option list, right preview + name +
  surface line, footer Cancel / Place in room.
- `ModelPreview.tsx` — mini `<Canvas>` + `OrbitControls` + `FittedModel` of the
  selected GLB.
- `icons.tsx` — inline stroke SVGs (swatch-grid, plus, sparkle, sun, chevron,
  close, link, cube) from the handoff.

## State (zustand `state/configurator.ts`)
- `activeTool: "materials" | "items" | "actions" | null` (which flyout is open).
- `picker: { title: string; refs: string[]; surfaceLabel?: string; slotId?: string } | null`.
- actions: `setActiveTool`, `openPicker(target)`, `closePicker()`.
- Picker "Place in room": if `slotId` → `assignSlot(slotId, ref)`; else
  `setTool({ kind: "place", ref })`. Then `closePicker()`.
- Current-room lights: a `useCurrentZone(room)` hook (rAF-throttled read of the
  `cameraMini` singleton → current zoneId) drives the top-bar segment via the
  existing `roomLights` / `setRoomLight`.

## Wiring
- `Hud.tsx` becomes a thin composition: `<ToolRail/> <ToolFlyout/> <TopBar/>
  <Minimap/>` (+ existing edit/selection banners). Old left panel + old top bar
  removed.
- `page.tsx` renders `<ModelPicker/>` reading the store; the local `pickerSlot`
  state is removed.
- `SlotMarkers` pills call `openPicker({ ..., slotId })` instead of `onSlotClick`.

## Testing
- Store: `setActiveTool`, `openPicker`/`closePicker`, place-vs-slot branch.
- Item groups map to the right product refs (door, storage trio, table).
- Existing suite stays green; `next build` clean.

## Implementation checklist
- [x] Tokens/Manrope + `icons.tsx`.
- [x] Store: activeTool + picker state/actions.
- [x] ToolRail (Materials/Items/Actions) with flyout.
- [x] TopBar (current-room lights, cones, time).
- [x] ModelPicker + ModelPreview (rotatable GLB).
- [x] Restyle Minimap chrome (light frosted) + collapse + plan switcher; wire
      SlotMarkers → openPicker.
- [x] Thin Hud; remove old panels; remove page.tsx local picker.
- [x] `next build` clean + 78 tests pass.
- [ ] User visually verifies the new chrome at /configurator (resume here).

## Resume here
Chrome rebuilt and building. Floor-plan switcher moved into the floor-plan panel
(old left panel is gone). Transient banners (edit/select/paint hints) left in the
old dark style — restyle only if the user wants. Nothing committed/deployed.
