"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Phase = "idle" | "opening" | "entering";

/** 문이 열리는 시간 → 문간으로 들어가기 시작하는 시점 */
const OPEN_MS = 620;
/** 들어가는 연출이 끝나고 서랍장으로 넘어가는 시점 */
const ENTER_MS = 1560;

interface DoorSceneProps {
  name: string;
  role: string;
  onEnter: () => void;
}

/** 흰 배경 위의 문 하나. 누르면 열리면서 안으로 들어간다. */
export function DoorScene({ name, role, onEnter }: DoorSceneProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);
  const reducedMotion = useReducedMotion();

  // 화면을 벗어날 때 남은 타이머를 정리한다.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  const open = () => {
    if (phase !== "idle") return;

    if (reducedMotion) {
      onEnter();
      return;
    }

    setPhase("opening");
    timers.current.push(
      window.setTimeout(() => setPhase("entering"), OPEN_MS),
      window.setTimeout(onEnter, ENTER_MS),
    );
  };

  return (
    <div className="door-stage" data-phase={phase}>
      <div className="door-world">
        <div className="door-frame">
          <div className="doorway" />

          <button
            type="button"
            className="door"
            onClick={open}
            disabled={phase !== "idle"}
            aria-label={`${name}의 포트폴리오 — 문 열고 들어가기`}
          >
            <span className="door-panel is-top" />
            <span className="nameplate">
              <b>{name}</b>
              <i>{role}</i>
            </span>
            <span className="door-panel is-bottom" />
            <span className="knob" />
          </button>
        </div>
        <div className="floor-shadow" />
      </div>

      <p className="door-hint">문을 눌러 들어가기</p>
      <div className="flash" />
    </div>
  );
}
