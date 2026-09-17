"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  Euler,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { useGameStore, type BookPhase } from "@/store/useGameStore";
import { registerInteractive } from "./interactives";
import { BOOK } from "./layout";
import { SpineText } from "./SpineText";
import type { Project } from "@/types/project";

/** 치수는 layout.ts와 공유한다(관리자 슬롯 계산도 같은 값을 쓴다). */
const { thickness: T, height: H, depth: D, cover: COVER } = BOOK;

/** RPD 28장 — 지오메트리는 모든 책이 공유한다(책마다 새 모델을 만들지 않는다). */
const GEO = {
  cover: new BoxGeometry(COVER, H, D),
  pages: new BoxGeometry(T / 2 - COVER, H * 0.95, D * 0.96),
  spine: new BoxGeometry(T, H, COVER),
} as const;

const PHASE_DURATION: Record<string, number> = {
  PULLING: 1.0,
  OPENING: 0.75,
  CLOSING: 0.55,
  RETURNING: 0.9,
};

/** 열린 책이 카메라로부터 떨어지는 거리 */
const VIEW_DISTANCE = 0.55;
const VIEW_DROP = 0.025;
/**
 * 열람 중 책 확대 배율.
 * 펼친 지면이 화면의 프로젝트 UI보다 크게 보여야 UI가 "지면에 인쇄된 것"처럼
 * 읽힌다. 배율을 주지 않으면 책이 UI보다 작아 두 요소가 분리돼 보인다.
 */
const OPEN_SCALE = 1.9;
/** 독서대처럼 상단을 살짝 뒤로 젖히는 각도 */
const VIEW_TILT = 0.22;
const OPEN_ANGLE = Math.PI * 0.97;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

interface BookProps {
  project: Project;
  selected: boolean;
  focused: boolean;
}

/**
 * 프로젝트 책 한 권. RPD 26장의 상태 머신을 useFrame에서 직접 구동한다.
 *
 * 좌표 규약
 * - 닫힌 상태: 책등이 local +z를 향하고, DB의 rotation.y로 책장 방향에 맞춘다.
 * - 펼친 상태: 표지가 책등(local y축, z=+D/2)을 중심으로 회전하므로
 *   펼쳐진 지면은 x ≈ -T/2 평면에 놓이고 법선은 local +x가 된다.
 *   따라서 local +x가 카메라를 향하게 놓으면 지면이 정면으로 보인다.
 */
export function Book({ project, selected, focused }: BookProps) {
  const { camera } = useThree();

  const root = useRef<Group>(null);
  const hinge = useRef<Group>(null);
  const hitbox = useRef<Mesh>(null);

  const phase = useRef<BookPhase>("IDLE");
  const elapsed = useRef(0);
  /** 표지 펼침 정도 0..1 */
  const spread = useRef(0);
  /** 하이라이트 강도 0..1 */
  const highlight = useRef(0);
  /** 책장 크기(1) ↔ 열람 크기(OPEN_SCALE) 보간값 */
  const zoom = useRef(1);

  const shelfPosition = useMemo(
    () => new Vector3(project.position.x, project.position.y, project.position.z),
    [project.position.x, project.position.y, project.position.z],
  );
  const shelfQuaternion = useMemo(
    () =>
      new Quaternion().setFromEuler(
        new Euler(project.rotation.x, project.rotation.y, project.rotation.z),
      ),
    [project.rotation.x, project.rotation.y, project.rotation.z],
  );

  /** 책장에서 빠져나오는 방향(책등이 바라보는 쪽) */
  const outward = useMemo(
    () => new Vector3(0, 0, 1).applyQuaternion(shelfQuaternion).normalize(),
    [shelfQuaternion],
  );

  const materials = useMemo(() => {
    const cover = new MeshStandardMaterial({
      color: project.bookColor,
      emissive: project.bookColor,
      emissiveIntensity: 0,
      roughness: 0.78,
      metalness: 0.04,
    });
    // globals.css의 --paper와 같은 색 — 오버레이 UI가 지면에 인쇄된 것처럼 보이게 한다.
    const paper = new MeshStandardMaterial({ color: "#e5d8ba", roughness: 0.95 });
    return { cover, paper };
  }, [project.bookColor]);

  useEffect(() => {
    return () => {
      materials.cover.dispose();
      materials.paper.dispose();
    };
  }, [materials]);

  // 크로스헤어 레이캐스트 대상 등록
  useEffect(() => {
    if (!hitbox.current) return;
    return registerInteractive(hitbox.current, project.id, "book");
  }, [project.id]);

  // 초기 포즈
  useEffect(() => {
    const group = root.current;
    if (!group) return;
    group.position.copy(shelfPosition);
    group.quaternion.copy(shelfQuaternion);
    group.scale.set(project.scale.x, project.scale.y, project.scale.z);
  }, [shelfPosition, shelfQuaternion, project.scale]);

  // 재사용 임시 객체 (프레임마다 할당하지 않는다)
  const tmp = useMemo(
    () => ({
      spreadCenter: new Vector3(),
      forward: new Vector3(),
      normal: new Vector3(),
      up: new Vector3(),
      axisX: new Vector3(),
      axisY: new Vector3(),
      axisZ: new Vector3(),
      matrix: new Matrix4(),
      quat: new Quaternion(),
      tilt: new Quaternion(),
      control: new Vector3(),
      target: new Vector3(),
      offset: new Vector3(),
      a: new Vector3(),
      b: new Vector3(),
    }),
    [],
  );

  /**
   * 카메라 앞 열람 포즈를 계산한다.
   * 펼쳐진 지면의 중심(local -T/2, 0, D/2)이 카메라 정면에 오도록 그룹 원점을 보정한다.
   */
  const computeOpenPose = (outPos: Vector3, outQuat: Quaternion, zoomLevel = OPEN_SCALE) => {
    const s = project.scale;

    camera.getWorldDirection(tmp.forward);
    tmp.spreadCenter
      .copy(camera.position)
      .addScaledVector(tmp.forward, VIEW_DISTANCE)
      .addScaledVector(tmp.up.set(0, 1, 0), -VIEW_DROP);

    // local +x = 책 → 카메라 방향
    tmp.normal.copy(camera.position).sub(tmp.spreadCenter).normalize();
    tmp.up.set(0, 1, 0);
    tmp.axisX.copy(tmp.normal);
    tmp.axisY.copy(tmp.up).addScaledVector(tmp.axisX, -tmp.up.dot(tmp.axisX));
    if (tmp.axisY.lengthSq() < 1e-6) tmp.axisY.set(0, 0, 1); // 수직 조준 예외 처리
    tmp.axisY.normalize();
    tmp.axisZ.copy(tmp.axisX).cross(tmp.axisY).normalize();

    tmp.matrix.makeBasis(tmp.axisX, tmp.axisY, tmp.axisZ);
    outQuat.setFromRotationMatrix(tmp.matrix);
    // local z축(수평)을 기준으로 상단을 뒤로 젖힌다.
    outQuat.multiply(tmp.tilt.setFromAxisAngle(tmp.a.set(0, 0, 1), VIEW_TILT));

    // 그룹 원점 = 지면 중심 - R * (-T/2, 0, D/2) · (확대 배율 반영)
    tmp.offset
      .set((-T / 2) * s.x * zoomLevel, 0, (D / 2) * s.z * zoomLevel)
      .applyQuaternion(outQuat);
    outPos.copy(tmp.spreadCenter).sub(tmp.offset);
  };

  /** 책장 ↔ 카메라 사이의 이차 베지어 경로 (책이 앞으로 빠진 뒤 공중으로 이동) */
  const pathPoint = (t: number, end: Vector3, out: Vector3) => {
    tmp.control
      .copy(shelfPosition)
      .addScaledVector(outward, 0.55)
      .add(tmp.a.set(0, 0.28, 0));

    const inv = 1 - t;
    out
      .copy(tmp.a.copy(shelfPosition).multiplyScalar(inv * inv))
      .add(tmp.b.copy(tmp.control).multiplyScalar(2 * inv * t))
      .add(tmp.a.copy(end).multiplyScalar(t * t));
    return out;
  };

  useFrame((state, rawDelta) => {
    const group = root.current;
    if (!group) return;

    // 프레임이 크게 밀려도 애니메이션이 튀지 않게 상한을 둔다.
    // 이동(Player)보다 상한이 큰 이유: 책 애니메이션은 충돌 판정이 없어서
    // 큰 스텝이 안전하고, 저성능 기기에서 펼침 동작이 과도하게 늘어지는 것을 막는다.
    const delta = Math.min(rawDelta, 0.1);
    const store = useGameStore.getState();
    const nextPhase = selected ? store.bookPhase : focused ? "HOVERED" : "IDLE";

    if (nextPhase !== phase.current) {
      // 이동 계열 상태로 진입할 때만 타이머를 초기화한다.
      if (PHASE_DURATION[nextPhase] !== undefined) elapsed.current = 0;
      phase.current = nextPhase;
    }

    const current = phase.current;
    const duration = PHASE_DURATION[current];
    const progress = duration ? Math.min(1, (elapsed.current += delta) / duration) : 0;

    // 하이라이트 — 과한 Glow 없이 밝기만 살짝(RPD 32장)
    const wantHighlight = current === "HOVERED" ? 1 : 0;
    highlight.current += (wantHighlight - highlight.current) * Math.min(1, delta * 10);
    materials.cover.emissiveIntensity = highlight.current * 0.45;

    switch (current) {
      case "IDLE":
      case "HOVERED": {
        // 조준 중에는 책등이 살짝 튀어나온다.
        const pop = highlight.current * 0.035;
        group.position.copy(shelfPosition).addScaledVector(outward, pop);
        group.quaternion.copy(shelfQuaternion);
        spread.current = 0;
        zoom.current = 1;
        break;
      }

      case "PULLING": {
        const t = easeInOut(progress);
        zoom.current = 1 + (OPEN_SCALE - 1) * t;
        computeOpenPose(tmp.target, tmp.quat, zoom.current);
        pathPoint(t, tmp.target, group.position);
        group.quaternion.slerpQuaternions(shelfQuaternion, tmp.quat, t);
        spread.current = 0;
        if (progress >= 1) useGameStore.getState().setBookPhase("OPENING");
        break;
      }

      case "OPENING": {
        zoom.current = OPEN_SCALE;
        computeOpenPose(tmp.target, tmp.quat, zoom.current);
        group.position.copy(tmp.target);
        group.quaternion.copy(tmp.quat);
        spread.current = easeOut(progress);
        if (progress >= 1) useGameStore.getState().bookOpened();
        break;
      }

      case "OPEN": {
        zoom.current = OPEN_SCALE;
        computeOpenPose(tmp.target, tmp.quat, zoom.current);
        // 아주 약한 부유감
        tmp.target.y += Math.sin(state.clock.elapsedTime * 0.9) * 0.004;
        group.position.lerp(tmp.target, Math.min(1, delta * 6));
        group.quaternion.slerp(tmp.quat, Math.min(1, delta * 6));
        spread.current = 1;
        break;
      }

      case "CLOSING": {
        zoom.current = OPEN_SCALE;
        computeOpenPose(tmp.target, tmp.quat, zoom.current);
        group.position.copy(tmp.target);
        group.quaternion.copy(tmp.quat);
        spread.current = 1 - easeInOut(progress);
        if (progress >= 1) useGameStore.getState().setBookPhase("RETURNING");
        break;
      }

      case "RETURNING": {
        const t = easeInOut(progress);
        zoom.current = OPEN_SCALE + (1 - OPEN_SCALE) * t;
        computeOpenPose(tmp.target, tmp.quat, zoom.current);
        // 펼치기 경로를 역으로 되짚어 책장에 다시 꽂힌다.
        pathPoint(1 - t, tmp.target, group.position);
        group.quaternion.slerpQuaternions(tmp.quat, shelfQuaternion, t);
        spread.current = 0;
        if (progress >= 1) useGameStore.getState().bookReturned();
        break;
      }

      default:
        break;
    }

    if (hinge.current) hinge.current.rotation.y = -OPEN_ANGLE * spread.current;

    const z = zoom.current;
    group.scale.set(project.scale.x * z, project.scale.y * z, project.scale.z * z);
  });

  const spineText = project.bookTitle.replace(/\\n/g, "\n");

  return (
    <group ref={root}>
      {/*
        레이캐스트용 히트박스. 책등보다 조금 넉넉하게 잡아 조준을 편하게 한다.
        (책장 슬롯 간격이 1m 이상이라 이웃한 책과 겹치지 않는다.)
        three의 Raycaster는 visible=false를 건너뛰지 않으므로 보이지 않아도 히트한다.
      */}
      <mesh ref={hitbox} position={[0, 0, D / 2 - 0.02]} visible={false}>
        <boxGeometry args={[T * 2.2, H * 1.15, 0.18]} />
        <meshBasicMaterial />
      </mesh>

      {/* 뒷표지 (고정) */}
      <mesh geometry={GEO.cover} material={materials.cover} position={[-T / 2, 0, 0]} castShadow />
      {/* 오른쪽 지면 (고정) */}
      <mesh
        geometry={GEO.pages}
        material={materials.paper}
        position={[-T / 2 + COVER / 2 + (T / 2 - COVER) / 2, 0, 0]}
      />

      {/* 책등 축(local y, z=+D/2)을 중심으로 회전하는 앞표지 + 왼쪽 지면 */}
      <group ref={hinge} position={[0, 0, D / 2]}>
        <mesh geometry={GEO.cover} material={materials.cover} position={[T / 2, 0, -D / 2]} castShadow />
        <mesh
          geometry={GEO.pages}
          material={materials.paper}
          position={[T / 2 - COVER / 2 - (T / 2 - COVER) / 2, 0, -D / 2]}
        />
      </group>

      {/* 책등 + 책등 제목 */}
      <mesh geometry={GEO.spine} material={materials.cover} position={[0, 0, D / 2 + COVER / 2]} castShadow />
      <SpineText
        position={[0, 0, D / 2 + COVER + 0.0015]}
        rotation={[0, 0, -Math.PI / 2]}
        fontSize={0.028}
        lineHeight={1.2}
        letterSpacing={0.04}
        color="#e8d9b5"
        anchorX="center"
        anchorY="middle"
        maxWidth={H * 0.88}
        textAlign="center"
        outlineWidth={0}
      >
        {spineText}
      </SpineText>
    </group>
  );
}
