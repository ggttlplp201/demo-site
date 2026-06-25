"use client";

/**
 * SceneExporter — lives inside the Canvas. Registers an export handler that
 * GLTFExporter-exports the assembled scene to a binary .glb. The sun (directional
 * lights) and the slot "+" ghosts are hidden during export so the .glb carries only
 * the room + items + interior lights; the worker adds the day/night world itself.
 * The HDRI environment is a renderer property (not a scene child), so it is never exported.
 */

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { registerExportHandler } from "@/lib/configurator/exportBridge";
import { useConfigurator } from "@/state/configurator";

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export default function SceneExporter() {
  const { scene } = useThree();
  const setCapturing = useConfigurator((s) => s.setCapturing);

  useEffect(() => {
    registerExportHandler(async () => {
      // hide the "+ add" ghosts (capturing flag) and the sun (directional lights)
      setCapturing(true);
      await nextFrame();
      const hiddenSuns: THREE.Light[] = [];
      scene.traverse((o) => {
        const l = o as THREE.DirectionalLight;
        if (l.isDirectionalLight && l.visible) { l.visible = false; hiddenSuns.push(l); }
      });
      try {
        const exporter = new GLTFExporter();
        const buf = await new Promise<ArrayBuffer>((resolve, reject) => {
          exporter.parse(
            scene,
            (result) => resolve(result as ArrayBuffer),
            (err) => reject(err),
            { binary: true, onlyVisible: true },
          );
        });
        return buf;
      } finally {
        hiddenSuns.forEach((l) => (l.visible = true));
        setCapturing(false);
      }
    });
    return () => registerExportHandler(null);
  }, [scene, setCapturing]);

  return null;
}
