"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Raycaster, Vector2, Vector3 } from "three";
import { useMoveKeys } from "@/hooks/useKeyboard";
import { useGameStore } from "@/store/useGameStore";
import { interactiveObjects, lookupInteractive } from "./interactives";
import { PLAYER, STATUE, resolveCollisions, viewingSpot } from "./layout";
import type { Project } from "@/types/project";

const BOOK_REACH = 2.6;
const LOOK_SENSITIVITY = 0.0022;
const PITCH_LIMIT = (85 * Math.PI) / 180;

interface PlayerProps {
  projects: Project[];
  touchMode: boolean;
}

/**
 * 1인칭 플레이어. 캐릭터 모델은 렌더링하지 않고 카메라 자체가 플레이어다(RPD 6장).
 * - 마우스 룩: 직접 Pointer Lock을 관리해 책 열람 중에는 잠금을 해제한다.
 * - 이동: 가감속 보간 + layout.ts의 AABB 충돌 해소.
 * - 조준: 매 프레임 화면 중앙에서 레이캐스트해 focus를 갱신한다.
 */
export function Player({ projects, touchMode }: PlayerProps) {
  const { camera, gl } = useThree();

  const keys = useMoveKeys();
  const yaw = useRef<number>(PLAYER.startYaw);
  const pitch = useRef<number>(0);
  const position = useRef(new Vector3(PLAYER.start.x, PLAYER.eyeHeight, PLAYER.start.z));
  const velocity = useRef(new Vector3());

  const raycaster = useMemo(() => new Raycaster(), []);
  const center = useMemo(() => new Vector2(0, 0), []);
  const forward = useMemo(() => new Vector3(), []);
  const right = useMemo(() => new Vector3(), []);
  const wish = useMemo(() => new Vector3(), []);
  const lastRaycast = useRef(0);

  // 카메라 초기 포즈
  useEffect(() => {
    camera.rotation.order = "YXZ";
    camera.position.copy(position.current);
  }, [camera]);

  // Pointer Lock 관리
  useEffect(() => {
    if (touchMode) return;
    const canvas = gl.domElement;

    const onClick = () => {
      const { interactionMode, indexOpen } = useGameStore.getState();
      if (interactionMode !== "explore" || indexOpen) return;
      if (document.pointerLockElement === canvas) return;
      // 브라우저가 거부할 수 있으므로(사용자 제스처 필요) 실패는 조용히 무시한다.
      void Promise.resolve(canvas.requestPointerLock()).catch(() => undefined);
    };

    const onLockChange = () => {
      useGameStore.getState().setPointerLocked(document.pointerLockElement === canvas);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      yaw.current -= e.movementX * LOOK_SENSITIVITY;
      pitch.current -= e.movementY * LOOK_SENSITIVITY;
      pitch.current = Math.min(Math.max(pitch.current, -PITCH_LIMIT), PITCH_LIMIT);
      useGameStore.getState().dismissHint();
    };

    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [gl, touchMode]);

  // 터치 기기: 드래그로 시점 이동(RPD 40장)
  useEffect(() => {
    if (!touchMode) return;
    const canvas = gl.domElement;
    let lastX = 0;
    let lastY = 0;
    let active = false;

    const onStart = (e: TouchEvent) => {
      if (useGameStore.getState().interactionMode !== "explore") return;
      active = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (!active) return;
      const t = e.touches[0];
      yaw.current -= (t.clientX - lastX) * LOOK_SENSITIVITY * 1.8;
      pitch.current -= (t.clientY - lastY) * LOOK_SENSITIVITY * 1.8;
      pitch.current = Math.min(Math.max(pitch.current, -PITCH_LIMIT), PITCH_LIMIT);
      lastX = t.clientX;
      lastY = t.clientY;
      useGameStore.getState().dismissHint();
    };
    const onEnd = () => {
      active = false;
    };

    canvas.addEventListener("touchstart", onStart, { passive: true });
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [gl, touchMode]);

  // 책이 열리면 포인터 락을 풀어 UI 버튼을 클릭할 수 있게 한다.
  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.interactionMode === prev.interactionMode) return;
      if (state.interactionMode !== "explore" && document.pointerLockElement) {
        document.exitPointerLock();
      }
    });
  }, []);

  // 프로젝트 인덱스(TAB)에서 선택한 책 근처로 이동
  useEffect(() => {
    return useGameStore.subscribe((state) => {
      if (!state.travelRequest) return;
      const project = projects.find((p) => p.id === state.travelRequest);
      useGameStore.getState().clearTravel();
      if (!project) return;

      const spot = viewingSpot(project.position, project.rotation.y, 1.35);
      position.current.set(spot.x, PLAYER.eyeHeight, spot.z);
      velocity.current.set(0, 0, 0);
      yaw.current = spot.yaw;

      // 책은 보통 눈높이보다 낮거나 높다. pitch를 0으로 두면 크로스헤어가
      // 책을 비껴가 [E] 프롬프트가 뜨지 않으므로, 책 중심을 겨누도록 맞춘다.
      const horizontal = Math.hypot(project.position.x - spot.x, project.position.z - spot.z);
      pitch.current = Math.atan2(project.position.y - PLAYER.eyeHeight, horizontal);
    });
  }, [projects]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05); // 탭 복귀 시 큰 delta로 벽을 통과하는 것 방지
    const { interactionMode, indexOpen, pointerLocked } = useGameStore.getState();

    camera.rotation.set(pitch.current, yaw.current, 0);

    // 책 열람 중에는 이동을 멈춘다(RPD 12장).
    const canMove = interactionMode === "explore" && !indexOpen && (pointerLocked || touchMode);

    forward.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    right.set(forward.z, 0, -forward.x);

    wish.set(0, 0, 0);
    if (canMove && !touchMode) {
      const k = keys.current;
      if (k.forward) wish.add(forward);
      if (k.back) wish.sub(forward);
      if (k.right) wish.add(right);
      if (k.left) wish.sub(right);
      if (wish.lengthSq() > 0) {
        wish.normalize().multiplyScalar(k.sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed);
        useGameStore.getState().dismissHint();
      }
    }

    // 지수 감쇠 보간으로 자연스러운 가감속
    const blend = 1 - Math.exp(-PLAYER.damping * delta);
    velocity.current.lerp(wish, blend);

    if (velocity.current.lengthSq() > 1e-6) {
      const next = resolveCollisions(
        position.current.x + velocity.current.x * delta,
        position.current.z + velocity.current.z * delta,
        PLAYER.radius,
      );
      position.current.x = next.x;
      position.current.z = next.z;
    }

    // 걷는 동안 아주 약한 상하 흔들림
    const bob = Math.sin(performance.now() * 0.011) * 0.012 * Math.min(1, velocity.current.length());
    camera.position.set(position.current.x, PLAYER.eyeHeight + bob, position.current.z);

    // 동상 근접 여부 (RPD 8장)
    const nearStatue =
      Math.hypot(position.current.x - STATUE.position.x, position.current.z - STATUE.position.z) <
      STATUE.interactRadius;
    if (useGameStore.getState().aboutOpen !== nearStatue && interactionMode === "explore") {
      useGameStore.getState().setAboutOpen(nearStatue);
    }

    // 조준 레이캐스트는 60fps로 돌릴 필요가 없어 ~12Hz로 제한한다.
    const now = performance.now();
    if (interactionMode === "explore" && now - lastRaycast.current > 80) {
      lastRaycast.current = now;
      raycaster.setFromCamera(center, camera);
      raycaster.far = BOOK_REACH;

      const hits = raycaster.intersectObjects(interactiveObjects(), true);
      const entry = hits.length > 0 ? lookupInteractive(hits[0].object) : undefined;
      const current = useGameStore.getState().focus;

      if (entry) {
        if (current?.kind !== "book" || current.id !== entry.id) {
          useGameStore.getState().setFocus({ kind: "book", id: entry.id });
        }
      } else if (current) {
        useGameStore.getState().setFocus(null);
      }
    }
  });

  return null;
}
