"use client";

import { useMemo } from "react";
import { Object3D } from "three";
import { ROOM, STATUE } from "./layout";

/**
 * RPD 28장 — 실시간 광원을 최소화한다.
 * 환경광 + 창문 방향 directional(그림자 담당) + 샹들리에 point 2개만 사용한다.
 */
export function Lighting() {
  // spotLight.target은 씬 그래프에 포함되어야 matrixWorld가 갱신된다.
  const statueTarget = useMemo(() => new Object3D(), []);

  return (
    <>
      <ambientLight intensity={0.55} color="#7d6a52" />
      <hemisphereLight intensity={0.42} color="#8aa0c0" groundColor="#3a2b1e" />

      {/* 서쪽 창문에서 들어오는 약한 빛 */}
      <directionalLight
        position={[-14, 9, 3]}
        intensity={1.35}
        color="#f2d3a0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-bias={-0.0012}
      />

      {/* 천장 조명 — 따뜻한 색, 그림자 없음 */}
      <pointLight position={[0, ROOM.height - 2.4, -3.5]} intensity={38} distance={22} decay={2} color="#ffb765" />
      <pointLight position={[0, ROOM.height - 2.4, 5.5]} intensity={32} distance={21} decay={2} color="#ffb765" />

      {/* 동상 강조용 약한 스포트 */}
      <primitive object={statueTarget} position={[STATUE.position.x, 0.6, STATUE.position.z]} />
      <spotLight
        position={[STATUE.position.x, 5.2, STATUE.position.z]}
        target={statueTarget}
        angle={0.5}
        penumbra={0.85}
        intensity={34}
        distance={11}
        decay={2}
        color="#ffd9a8"
      />
    </>
  );
}
