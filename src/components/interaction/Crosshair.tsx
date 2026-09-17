"use client";

import { useGameStore } from "@/store/useGameStore";

/** RPD 35장 — 평상시에는 크로스헤어만, 열람 중에는 숨긴다. */
export function Crosshair() {
  const mode = useGameStore((s) => s.interactionMode);
  const focus = useGameStore((s) => s.focus);
  const indexOpen = useGameStore((s) => s.indexOpen);

  if (mode !== "explore" || indexOpen) return null;
  return <div className="crosshair" data-focused={focus !== null} aria-hidden />;
}
