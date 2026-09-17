"use client";

import { STATUE } from "./layout";
import { SpineText } from "./SpineText";
import type { AboutProfile } from "@/types/project";

/**
 * RPD 8장 — 도서관 중앙의 흉상. 근처에 가면 About Me가 표시된다.
 * (About 카드 자체는 DOM 오버레이인 AboutPanel이 담당한다.)
 */
export function Statue({ about }: { about: AboutProfile }) {
  return (
    <group position={[STATUE.position.x, 0, STATUE.position.z]}>
      {/* 좌대 */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[STATUE.pedestalRadius, STATUE.pedestalRadius + 0.06, 0.12, 32]} />
        <meshStandardMaterial color="#3a352e" roughness={0.9} />
      </mesh>
      <mesh position={[0, STATUE.pedestalHeight / 2 + 0.12, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[STATUE.pedestalRadius * 0.72, STATUE.pedestalRadius * 0.82, STATUE.pedestalHeight, 32]} />
        <meshStandardMaterial color="#464038" roughness={0.85} />
      </mesh>

      {/* 명패 */}
      <mesh position={[0, 0.72, STATUE.pedestalRadius * 0.74]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.72, 0.2, 0.02]} />
        <meshStandardMaterial color="#8a6b3a" roughness={0.5} metalness={0.6} />
      </mesh>
      <SpineText
        position={[0, 0.72, STATUE.pedestalRadius * 0.74 + 0.02]}
        rotation={[-0.1, 0, 0]}
        fontSize={0.075}
        color="#1c1510"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.66}
      >
        {about.name}
      </SpineText>

      {/* 흉상 — 절차적 형태(RPD 27장의 Blender 에셋으로 교체 가능).
          비율: 어깨를 넓게, 머리를 작게 잡아 체스 폰처럼 보이지 않도록 한다. */}
      <group position={[0, STATUE.pedestalHeight + 0.12, 0]}>
        {/* 몸통 — 아래가 넓고 위로 좁아진다 */}
        <mesh position={[0, 0.21, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.3, 0.42, 28]} />
          <meshStandardMaterial color="#5b5348" roughness={0.8} />
        </mesh>

        {/* 어깨 — 납작하게 눌린 구체로 폭을 만든다 */}
        <mesh position={[0, 0.4, 0]} scale={[1.06, 0.42, 0.72]} castShadow>
          <sphereGeometry args={[0.28, 28, 18]} />
          <meshStandardMaterial color="#5f574b" roughness={0.78} />
        </mesh>

        {/* 목 */}
        <mesh position={[0, 0.51, 0.005]} castShadow>
          <cylinderGeometry args={[0.062, 0.075, 0.13, 18]} />
          <meshStandardMaterial color="#605848" roughness={0.76} />
        </mesh>

        {/* 머리 */}
        <mesh position={[0, 0.64, 0.012]} scale={[0.92, 1.16, 1.0]} castShadow>
          <sphereGeometry args={[0.115, 28, 22]} />
          <meshStandardMaterial color="#635a4a" roughness={0.74} />
        </mesh>

        {/* 뒤통수 머리카락 덩어리 */}
        <mesh position={[0, 0.665, -0.028]} scale={[1.0, 0.94, 0.82]} castShadow>
          <sphereGeometry args={[0.118, 22, 18]} />
          <meshStandardMaterial color="#544b3d" roughness={0.88} />
        </mesh>

        {/* 코 — 멀리서도 정면을 알 수 있게 하는 최소한의 디테일.
            coneGeometry의 축은 +y이므로 X로 90도 돌려 +z(정면)를 향하게 한다. */}
        <mesh position={[0, 0.632, 0.104]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.018, 0.042, 10]} />
          <meshStandardMaterial color="#635a4a" roughness={0.74} />
        </mesh>
      </group>
    </group>
  );
}
