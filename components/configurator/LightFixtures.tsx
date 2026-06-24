"use client";

/**
 * LightFixtures — per-room interior lighting. Each light zone independently
 * shows EITHER a hanging bar OR recessed round ceiling lights (never both),
 * with its own quantity, auto-spaced across the zone.
 *
 * Direction: both fixture types emit DOWNWARD toward the floor —
 *  - the bar's RectAreaLight is aimed straight down with lookAt()
 *  - each ceiling SpotLight targets a point 2 m below it
 * Temporary helpers (SHOW_HELPERS) visualise the emit direction.
 */

import { useEffect, useRef } from "react";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js";
import { useHelper } from "@react-three/drei";
import * as THREE from "three";
import type { LightZone, RoomShell } from "@/lib/configurator/types";
import { useConfigurator } from "@/state/configurator";
import FittedModel from "./FittedModel";

RectAreaLightUniformsLib.init(); // required for RectAreaLight
const WARM = "#ffd6a8"; // ~3200K
const SHOW_HELPERS = true; // temporary — confirm light direction, then turn off

// ---- hanging light bar (emits down from the underside) --------------------
function HangingBar({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.RectAreaLight>(null!);
  useHelper(SHOW_HELPERS ? lightRef : null, RectAreaLightHelper);
  useEffect(() => {
    const l = lightRef.current;
    if (!l) return;
    const wp = new THREE.Vector3();
    l.getWorldPosition(wp);
    l.lookAt(wp.x, wp.y - 1, wp.z); // emit straight down toward the floor
  }, []);
  return (
    <group position={position}>
      <group rotation={[0, 0, Math.PI / 2]}>
        <FittedModel url="/models/hanging_light_bar.glb" realDimsMm={{ w: 1, h: 1, d: 1 }} fitMaxSize={1.5} ground={false} castShadow={false} />
      </group>
      {/* area light placed below the bar body, aimed down */}
      <rectAreaLight ref={lightRef} position={[0, -0.14, 0]} width={1.3} height={0.28} intensity={6} color={WARM} />
    </group>
  );
}

// ---- recessed round ceiling light (spotlight straight down) ---------------
function CeilingLight({ position }: { position: [number, number, number] }) {
  const spotRef = useRef<THREE.SpotLight>(null!);
  const targetRef = useRef<THREE.Object3D>(null!);
  useHelper(SHOW_HELPERS ? spotRef : null, THREE.SpotLightHelper, "cyan");
  useEffect(() => {
    const s = spotRef.current, t = targetRef.current;
    if (!s || !t) return;
    s.target = t;
    t.updateMatrixWorld();
  }, []);
  return (
    <group position={position}>
      {/* recessed fixture model, flat & facing down */}
      <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <FittedModel url="/models/ceiling_light_round.glb" realDimsMm={{ w: 1, h: 1, d: 1 }} fitMaxSize={0.3} ground={false} castShadow={false} />
      </group>
      {/* emissive lens (glow only) */}
      <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.085, 24]} />
        <meshStandardMaterial color="#ffffff" emissive={WARM} emissiveIntensity={2.6} toneMapped={false} />
      </mesh>
      <spotLight ref={spotRef} position={[0, -0.05, 0]} angle={0.7} penumbra={0.6} intensity={6} distance={9} decay={1.3} color={WARM} castShadow={false} />
      <object3D ref={targetRef} position={[0, -2, 0]} />
    </group>
  );
}

// ---- evenly spread `count` positions across a zone ------------------------
function gridPositions(z: LightZone, count: number): [number, number, number][] {
  const cols = Math.min(count, 3), rows = Math.ceil(count / cols);
  const out: [number, number, number][] = [];
  let n = 0;
  for (let r = 0; r < rows && n < count; r++) {
    for (let c = 0; c < cols && n < count; c++, n++) {
      const fx = cols === 1 ? 0.5 : (c + 0.5) / cols;
      const fz = rows === 1 ? 0.5 : (r + 0.5) / rows;
      out.push([THREE.MathUtils.lerp(z.x0, z.x1, fx), z.ceilingY, THREE.MathUtils.lerp(z.z0, z.z1, fz)]);
    }
  }
  return out;
}

export default function LightFixtures({ room }: { room: RoomShell }) {
  const roomLights = useConfigurator((s) => s.roomLights);
  return (
    <>
      {room.lightZones.map((z) => {
        const cfg = roomLights[z.id];
        if (!cfg || cfg.type === "none" || cfg.count <= 0) return null;
        const pts = gridPositions(z, cfg.count);
        if (cfg.type === "bar")
          return pts.map((p, i) => <HangingBar key={`${z.id}-bar-${i}`} position={[p[0], z.ceilingY - 0.85, p[2]]} />);
        return pts.map((p, i) => <CeilingLight key={`${z.id}-c-${i}`} position={p} />);
      })}
    </>
  );
}
