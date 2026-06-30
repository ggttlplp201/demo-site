# Floor-plan picker + second floorplan — design

Date: 2026-06-29
Status: approved (design), implementation pending

## Goal
Let configurator users choose between preset floor plans. Add a second plan (the
"Upper Floor" from the provided bedrooms-floor image). Remove the solid-colour
materials, keeping only the imported textured sets. Keep all 3D catalogue models.
The new plan must have feature parity with the existing one (per-room lights,
minimap, photoreal tour) and its own preset item slots.

## Key architecture facts (current)
- A floor plan is a `RoomShell` produced by a builder function. Today only
  `primitiveHouse()` exists (id `house-40x30`).
- `scene.room` (string id) selects the plan; the page derives
  `room = getRoomShell(sceneRoom)`. `getRoomShell` currently ignores the id and
  always returns `primitiveHouse()`.
- `RoomShell.lightZones` is the carrier for three features at once: per-room
  interior **lights**, **minimap** cells, and photoreal-tour **capture spots**
  (`computeCaptureSpots` maps one spot per light zone). Give the new plan zones →
  all three work for free.
- Geometry helpers (`px/pz`, `floorFt`, `hWallFt`, `vWallFt`, `zone`, slot
  builders) close over module-level constants `W/D/HX/HZ` hardcoded to 40×30.
- Materials: solid-colour entries have no `textures`; textured ones do.
  `defaultMaterials` references only textured ids (`wood-floor-051`, `wallpaper`).

## Decisions
- **Switch behavior:** reset to a fresh plan (default materials, no items). Slot/
  surface ids are plan-specific and can't carry over.
- **Picker UI:** a "Floor plan" section at the top of the left HUD panel.
- **Stairs:** no stair asset exists, so the central staircase is represented as a
  plain landing/hall floor area (walkable, paintable), not 3D stairs.
- **Plan names:** "Main Floor" (`house-40x30`), "Upper Floor" (`upper-30x32`).

## Changes

### 1. Floor-plan registry (`lib/configurator/rooms.ts`)
- Refactor the 40×30-bound helpers into a factory `planHelpers(wFt, dFt)` that
  returns dimension-aware `px/pz/floorFt/hWallFt/vWallFt/zone/door/...`. Both
  builders use it.
- `primitiveHouse()` keeps id `house-40x30`, gains label "Main Floor".
- New `upperFloor()` builder, id `upper-30x32`, label "Upper Floor".
- `FLOOR_PLANS: { id, label, build }[]` registry. `getRoomShell(id)` looks it up
  (keep the existing GLB path), falling back to the first plan.

### 2. Switching (`state/configurator.ts`)
- Add `setRoom(id)`: `emptyScene(id)` + clear selection/edit, tool→look, reset
  `roomLights` to the plan's default (zone ids differ per plan).

### 3. Picker UI (`components/configurator/Hud.tsx`)
- "Floor plan" section at top of the left panel; one button per `FLOOR_PLANS`,
  active = `scene.room`; calls `setRoom`.
- Reset the local `zoneId` state when `room.id` changes (avoid stale zone).

### 4. Material cleanup (`lib/configurator/products.ts`)
- Remove solid-colour entries: `marble-white`, `walnut`, `slate`, `sage`, `oak`.
- Keep textured: `wallpaper`, `wood-093`, `wood-floor-051`, `tiles-002`.

### 5. Upper Floor builder (from the image)
~30×32 ft footprint (own dimensions). Rooms: Bedroom #3 (NW), Bedroom #2 (SW),
Master Bedroom (NE), Bathroom (SE), Walk-in closet (N-centre), central stair/
landing hall. Exterior windows (fixtures), interior partitions with door
openings. Light zones for Bedroom #2, Bedroom #3, Master, Bathroom. Preset slots:
a door at each room entry, a dresser in each bedroom, a wardrobe in the walk-in +
master, a cabinet by the landing. Exact coordinates finalized during
implementation with a plan grid.

## Data flow / risk
`Scene`, `Hud`, `Minimap`, `computeCaptureSpots` already consume a generic
`RoomShell`, so once the new builder returns valid surfaces + lightZones + slots,
minimap + lights + tour work with no changes to those components.

## Testing
- `getRoomShell` returns each registered plan id.
- `upperFloor()` yields unique surface/slot ids and ≥4 light zones.
- `MATERIALS` no longer contains the removed ids; defaults still resolve.
- Existing suite stays green.

## Implementation checklist
- [x] Refactor `planHelpers(wFt, dFt)` factory; reimplement `primitiveHouse` on it.
- [x] Add `upperFloor()` builder + `FLOOR_PLANS` registry; update `getRoomShell`.
- [x] Add `setRoom` action to the store.
- [x] Add "Floor plan" HUD section + zoneId reset on room change.
- [x] Remove solid-colour materials.
- [x] Tests for registry, upper-floor validity (61 pass).
- [x] Local `next build` + full `tsc --noEmit` clean.
- [ ] User visually verifies upper-floor geometry at /configurator (resume here).

## Resume here
Implementation done and building. Next: user eyeballs the Upper Floor in the
browser — wall/door positions and room sizes are a best-approximation from the
image and may need coordinate tweaks in `upperFloor()`. Nothing committed/deployed
yet (local-first gate). The earlier render-worker brightness/resolution + nav-bar
changes are also still uncommitted and pending a Modal redeploy + visual check.
