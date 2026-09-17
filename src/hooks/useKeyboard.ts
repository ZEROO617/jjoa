"use client";

import { useEffect, useRef } from "react";

export interface KeyState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
}

const MOVE_KEYS: Record<string, keyof KeyState> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  ShiftLeft: "sprint",
  ShiftRight: "sprint",
};

/** WASD/방향키 이동 입력을 ref로 유지한다(리렌더 없이 useFrame에서 읽기 위함). */
export function useMoveKeys() {
  const keys = useRef<KeyState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    sprint: false,
  });

  useEffect(() => {
    const set = (code: string, value: boolean) => {
      const key = MOVE_KEYS[code];
      if (key) keys.current[key] = value;
    };
    const onDown = (e: KeyboardEvent) => set(e.code, true);
    const onUp = (e: KeyboardEvent) => set(e.code, false);
    // 탭 전환 등으로 keyup을 놓치면 계속 움직이므로 초기화한다.
    const onBlur = () => {
      keys.current = { forward: false, back: false, left: false, right: false, sprint: false };
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return keys;
}
