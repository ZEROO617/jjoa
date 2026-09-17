"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
import {
  BOOK,
  BOOKCASES,
  BOOK_SPINE_FRONT,
  DESKS,
  ROOM,
  WINDOWS,
  worldToBookcaseLocal,
  type BookcaseDef,
  type DeskDef,
} from "./layout";
import type { Project } from "@/types/project";

/** 장식용 책의 앞면 깊이 — 프로젝트 책의 책등보다 뒤로 물린다. */
const FILLER_FRONT = BOOK_SPINE_FRONT - 0.05;
/** 책장 뒷판(local z ≈ -0.24)을 뚫지 않는 두께 */
const FILLER_DEPTH = 0.28;

/**
 * 도서관 구조물.
 *
 * 설계 노트: RPD 27장은 Blender에서 Library.glb를 제작하는 것을 권장한다.
 * 이 저장소에는 바이너리 3D 에셋을 넣지 않으므로, 동일한 치수(layout.ts)를 따르는
 * 절차적 지오메트리로 구현했다. 나중에 /public/models/library.glb 를 추가하면
 * 이 컴포넌트만 useGLTF 로 교체하면 되고, 충돌/책 좌표는 그대로 유지된다.
 */
export function Library({ projects = [] }: { projects?: Project[] }) {
  const wallY = ROOM.height / 2;
  const halfW = ROOM.width / 2;
  const halfD = ROOM.depth / 2;

  return (
    <group>
      {/* 바닥 — 석재 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#2b2521" roughness={0.92} metalness={0.02} />
      </mesh>

      {/* 중앙 목재 러그 영역 — 시작 지점을 시각적으로 표시 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 1.4]} receiveShadow>
        <circleGeometry args={[4.2, 48]} />
        <meshStandardMaterial color="#33201a" roughness={0.95} />
      </mesh>

      {/* 천장 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, 0]}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#1a1512" roughness={1} />
      </mesh>

      {/* 벽 4면 */}
      <Wall position={[0, wallY, -halfD]} size={[ROOM.width, ROOM.height, ROOM.wallThickness]} />
      <Wall position={[0, wallY, halfD]} size={[ROOM.width, ROOM.height, ROOM.wallThickness]} />
      <Wall position={[-halfW, wallY, 0]} size={[ROOM.wallThickness, ROOM.height, ROOM.depth]} />
      <Wall position={[halfW, wallY, 0]} size={[ROOM.wallThickness, ROOM.height, ROOM.depth]} />

      {/* 벽 하단 목재 몰딩 */}
      <Molding />

      {/* 천장 목재 보 */}
      {[-7, -2.5, 2, 6.5].map((z) => (
        <mesh key={z} position={[0, ROOM.height - 0.28, z]} castShadow>
          <boxGeometry args={[ROOM.width - 0.6, 0.34, 0.46]} />
          <meshStandardMaterial color="#231710" roughness={0.9} />
        </mesh>
      ))}

      {WINDOWS.map((w, i) => (
        <Window key={i} wall={w.wall} offset={w.offset} />
      ))}

      {BOOKCASES.map((b) => (
        <Bookcase key={b.id} def={b} projects={projects} />
      ))}

      {DESKS.map((d, i) => (
        <Desk key={i} def={d} />
      ))}

      {/* 샹들리에 — 광원은 Lighting에서 담당, 여기서는 형태만 */}
      {[-3.5, 5.5].map((z) => (
        <group key={z} position={[0, ROOM.height - 1.5, z]}>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
            <meshStandardMaterial color="#1b1614" roughness={0.8} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.55, 0.045, 6, 20]} />
            <meshStandardMaterial color="#2e241c" roughness={0.7} metalness={0.35} />
          </mesh>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.55, 0.12, Math.sin(angle) * 0.55]}>
                <sphereGeometry args={[0.075, 10, 10]} />
                <meshStandardMaterial
                  color="#ffca7a"
                  emissive="#ffb04a"
                  emissiveIntensity={2.4}
                  roughness={0.4}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function Wall({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#332a23" roughness={0.95} />
    </mesh>
  );
}

function Molding() {
  const halfW = ROOM.width / 2;
  const halfD = ROOM.depth / 2;
  return (
    <group>
      {[
        { p: [0, 0.4, -halfD + 0.3] as [number, number, number], s: [ROOM.width, 0.8, 0.14] as [number, number, number] },
        { p: [0, 0.4, halfD - 0.3] as [number, number, number], s: [ROOM.width, 0.8, 0.14] as [number, number, number] },
        { p: [-halfW + 0.3, 0.4, 0] as [number, number, number], s: [0.14, 0.8, ROOM.depth] as [number, number, number] },
        { p: [halfW - 0.3, 0.4, 0] as [number, number, number], s: [0.14, 0.8, ROOM.depth] as [number, number, number] },
      ].map((m, i) => (
        <mesh key={i} position={m.p}>
          <boxGeometry args={m.s} />
          <meshStandardMaterial color="#2a1d15" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** 창문 — 유리 대신 발광 면으로 처리해 광원 추가 없이 빛이 드는 느낌을 준다. */
function Window({ wall, offset }: { wall: "west" | "east"; offset: number }) {
  const x = wall === "west" ? -ROOM.width / 2 + ROOM.wallThickness / 2 + 0.03 : ROOM.width / 2 - ROOM.wallThickness / 2 - 0.03;
  const rotationY = wall === "west" ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={[x, 3.4, offset]} rotation={[0, rotationY, 0]}>
      <mesh>
        <planeGeometry args={[1.7, 3.4]} />
        <meshBasicMaterial color="#cfe0f0" toneMapped={false} />
      </mesh>
      {/* 창틀 */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.1, 3.4, 0.06]} />
        <meshStandardMaterial color="#1e1712" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[1.7, 0.1, 0.06]} />
        <meshStandardMaterial color="#1e1712" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Bookcase({ def, projects }: { def: BookcaseDef; projects: Project[] }) {
  const { width, height, depth, shelves } = def;
  const rotation: [number, number, number] = [0, (def.yaw * Math.PI) / 180, 0];

  /**
   * 이 책장에 놓인 프로젝트 책의 로컬 x/높이.
   * 같은 자리에 장식용 책을 놓으면 프로젝트 책과 겹쳐 보이므로 비워 둔다.
   */
  const occupied = useMemo(
    () =>
      projects
        .map((project) => ({
          local: worldToBookcaseLocal(def, project.position),
          y: project.position.y,
        }))
        // 책장 폭·깊이 안에 있는 책만 이 책장 소속으로 본다.
        .filter((p) => Math.abs(p.local.z) < depth && Math.abs(p.local.x) < width / 2 + 0.2)
        .map((p) => ({ x: p.local.x, y: p.y })),
    [def, depth, projects, width],
  );

  // 장식용 더미 책 — 프로젝트 책과 구분되도록 채도를 낮췄다.
  const filler = useMemo(() => {
    const palette = ["#4a3524", "#3b2a2a", "#2f3a32", "#403045", "#4a4033", "#33303d"];
    const rows: { y: number; items: { x: number; w: number; h: number; color: string }[] }[] = [];
    let seed = def.id.charCodeAt(0) * 37 + def.id.length;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let s = 0; s < shelves; s++) {
      const shelfY = 0.22 + (s * (height - 0.5)) / shelves;
      const items: { x: number; w: number; h: number; color: string }[] = [];
      let cursor = -width / 2 + 0.18;
      // 각 칸을 완전히 채우지 않고 빈 공간을 남겨 오래된 도서관 느낌을 낸다.
      while (cursor < width / 2 - 0.3) {
        if (rand() < 0.22) {
          cursor += 0.1 + rand() * 0.25;
          continue;
        }
        const w = 0.05 + rand() * 0.07;
        const x = cursor + w / 2;
        const h = 0.24 + rand() * 0.1;
        const centerY = shelfY + 0.025 + h / 2;

        // 프로젝트 책과 같은 칸·같은 높이면 건너뛴다.
        const clash = occupied.some(
          (o) => Math.abs(x - o.x) < BOOK.thickness * 2 && Math.abs(centerY - o.y) < 0.3,
        );
        if (!clash) {
          items.push({ x, w, h, color: palette[Math.floor(rand() * palette.length)] });
        }
        cursor += w + 0.005;
      }
      rows.push({ y: shelfY, items });
    }
    return rows;
  }, [def.id, height, occupied, shelves, width]);

  return (
    <group position={[def.x, 0, def.z]} rotation={rotation}>
      {/* 뒷판 */}
      <mesh position={[0, height / 2, -depth / 2 + 0.03]} receiveShadow>
        <boxGeometry args={[width, height, 0.06]} />
        <meshStandardMaterial color="#231710" roughness={0.95} />
      </mesh>
      {/* 측판 */}
      {[-width / 2 + 0.05, width / 2 - 0.05].map((x) => (
        <mesh key={x} position={[x, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.1, height, depth]} />
          <meshStandardMaterial color="#2e2015" roughness={0.9} />
        </mesh>
      ))}
      {/* 선반 + 상판 */}
      {Array.from({ length: shelves + 1 }).map((_, i) => (
        <mesh key={i} position={[0, 0.18 + (i * (height - 0.5)) / shelves, 0]} castShadow receiveShadow>
          <boxGeometry args={[width - 0.1, 0.05, depth]} />
          <meshStandardMaterial color="#35251a" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]} castShadow>
        <boxGeometry args={[width + 0.12, 0.12, depth + 0.08]} />
        <meshStandardMaterial color="#2a1c12" roughness={0.88} />
      </mesh>

      {/*
        장식용 책의 앞면(local z = FILLER_FRONT)은 프로젝트 책의 책등 앞면보다
        뒤에 있어야 한다. 그러지 않으면 프로젝트 책이 장식용 책에 가려
        제목이 보이지 않는다.
      */}
      {filler.map((row, ri) =>
        row.items.map((item, ii) => (
          <mesh
            key={`${ri}-${ii}`}
            position={[item.x, row.y + 0.025 + item.h / 2, FILLER_FRONT - FILLER_DEPTH / 2]}
            castShadow
          >
            <boxGeometry args={[item.w, item.h, FILLER_DEPTH]} />
            <meshStandardMaterial color={item.color} roughness={0.85} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Desk({ def }: { def: DeskDef }) {
  return (
    <group position={[def.x, 0, def.z]} rotation={[0, (def.yaw * Math.PI) / 180, 0]}>
      <mesh position={[0, def.height, 0]} castShadow receiveShadow>
        <boxGeometry args={[def.width, 0.07, def.depth]} />
        <meshStandardMaterial color="#3a2718" roughness={0.85} />
      </mesh>
      {[
        [-def.width / 2 + 0.1, def.depth / 2 - 0.1],
        [def.width / 2 - 0.1, def.depth / 2 - 0.1],
        [-def.width / 2 + 0.1, -def.depth / 2 + 0.1],
        [def.width / 2 - 0.1, -def.depth / 2 + 0.1],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, def.height / 2, z]} castShadow>
          <boxGeometry args={[0.09, def.height, 0.09]} />
          <meshStandardMaterial color="#2b1c12" roughness={0.9} />
        </mesh>
      ))}
      {/* 책상 위 스탠드 조명(형태만) */}
      <group position={[def.width / 2 - 0.45, def.height + 0.04, 0]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.12, 0.04, 12]} />
          <meshStandardMaterial color="#241a12" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
          <meshStandardMaterial color="#241a12" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <coneGeometry args={[0.15, 0.16, 14, 1, true]} />
          <meshStandardMaterial
            color="#4d2f1a"
            emissive="#ffb04a"
            emissiveIntensity={0.9}
            roughness={0.6}
            side={DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
