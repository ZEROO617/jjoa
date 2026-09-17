"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/useGameStore";

/** RPD 30장 — 도서관 콘셉트의 단순한 로딩 화면. */
export function LoadingScreen() {
  const { progress, active } = useProgress();
  const sceneReady = useGameStore((s) => s.sceneReady);
  const [done, setDone] = useState(false);

  // 로딩할 외부 에셋이 없어도(절차적 씬) 첫 프레임까지는 가려 준다.
  useEffect(() => {
    if (!sceneReady || active) return;
    const timer = window.setTimeout(() => setDone(true), 420);
    return () => window.clearTimeout(timer);
  }, [sceneReady, active]);

  const shown = sceneReady ? Math.max(progress, 100) : Math.max(progress, 12);

  return (
    <div className="loading" data-done={done} aria-hidden={done}>
      <h1>THE LIBRARY</h1>
      <div className="bar">
        <span style={{ width: `${Math.min(100, shown)}%` }} />
      </div>
      <div className="status">{done ? "Ready" : "Loading..."}</div>
    </div>
  );
}
