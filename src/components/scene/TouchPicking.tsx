"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Raycaster, Vector2 } from "three";
import { useGameStore } from "@/store/useGameStore";
import { interactiveObjects, lookupInteractive } from "./interactives";

/**
 * RPD 40장 — 터치 기기 Viewer Mode: 탭한 책으로 이동해 바로 펼친다.
 * 드래그와 구분하기 위해 이동 거리와 시간이 작을 때만 탭으로 인정한다.
 */
export function TouchPicking() {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);
  const pointer = useMemo(() => new Vector2(), []);

  useEffect(() => {
    const canvas = gl.domElement;
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = performance.now();
    };

    const onEnd = (e: TouchEvent) => {
      if (useGameStore.getState().interactionMode !== "explore") return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const moved = Math.hypot(touch.clientX - startX, touch.clientY - startY);
      if (moved > 14 || performance.now() - startTime > 500) return;

      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((touch.clientX - rect.left) / rect.width) * 2 - 1,
        -((touch.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      raycaster.far = 40; // 터치 모드는 이동이 없으므로 사거리를 넉넉히 둔다.

      const hits = raycaster.intersectObjects(interactiveObjects(), true);
      const entry = hits.length > 0 ? lookupInteractive(hits[0].object) : undefined;
      if (!entry) return;

      const store = useGameStore.getState();
      store.requestTravel(entry.id);
      store.openBook(entry.id);
    };

    canvas.addEventListener("touchstart", onStart, { passive: true });
    canvas.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [camera, gl, pointer, raycaster]);

  return null;
}
