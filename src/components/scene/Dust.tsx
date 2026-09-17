"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Points } from "three";
import { AdditiveBlending, BufferAttribute, BufferGeometry } from "three";
import { ROOM } from "./layout";

const COUNT = 170;

/** RPD 4.1 — 은은한 먼지 파티클. Points 하나로 처리해 드로우콜을 아낀다. */
export function Dust() {
  const ref = useRef<Points>(null);

  const { geometry, drift } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * (ROOM.width - 2);
      positions[i * 3 + 1] = Math.random() * (ROOM.height - 1) + 0.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * (ROOM.depth - 2);
      speeds[i] = 0.02 + Math.random() * 0.05;
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    return { geometry: geo, drift: speeds };
  }, []);

  useFrame((state, delta) => {
    const points = ref.current;
    if (!points) return;
    const attr = points.geometry.getAttribute("position") as BufferAttribute;
    const array = attr.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < COUNT; i++) {
      const yIndex = i * 3 + 1;
      array[yIndex] += drift[i] * delta;
      if (array[yIndex] > ROOM.height - 0.6) array[yIndex] = 0.3;
      // 좌우로 아주 느리게 흔들린다.
      array[i * 3] += Math.sin(t * 0.3 + i) * delta * 0.012;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.017}
        color="#e8cfa5"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
