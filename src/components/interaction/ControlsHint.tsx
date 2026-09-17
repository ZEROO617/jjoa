"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";

/** RPD 7장 — 접속 직후 잠깐 조작 안내를 띄우고, 움직이거나 시간이 지나면 사라진다. */
export function ControlsHint({ touchMode }: { touchMode: boolean }) {
  const hintVisible = useGameStore((s) => s.hintVisible);
  const sceneReady = useGameStore((s) => s.sceneReady);

  useEffect(() => {
    if (!sceneReady) return;
    const timer = window.setTimeout(() => useGameStore.getState().dismissHint(), 9000);
    return () => window.clearTimeout(timer);
  }, [sceneReady]);

  const rows: [string, string][] = touchMode
    ? [
        ["DRAG", "LOOK"],
        ["TAP BOOK", "OPEN"],
        ["TAB", "INDEX"],
      ]
    : [
        ["WASD", "MOVE"],
        ["MOUSE", "LOOK"],
        ["E", "INTERACT"],
        ["TAB", "INDEX"],
      ];

  return (
    <div className="hint" data-hidden={!hintVisible || !sceneReady} aria-hidden={!hintVisible}>
      {rows.map(([key, label]) => (
        <div key={key} style={{ display: "contents" }}>
          <b>{key}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
