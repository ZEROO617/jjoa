"use client";

import { useEffect, useState } from "react";

/** RPD 40장 — 터치 기기에서는 FPS 조작 대신 Viewer Mode로 동작한다. */
export function useIsTouchDevice(): boolean {
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: none) and (pointer: coarse)");
    setTouch(query.matches);
    const onChange = (e: MediaQueryListEvent) => setTouch(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return touch;
}
