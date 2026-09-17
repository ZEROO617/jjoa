/**
 * 도서관 치수와 충돌 박스의 단일 출처.
 * Library(시각)와 Player(충돌)가 같은 값을 참조하도록 여기서만 정의한다.
 * RPD 5장 — 공간은 넓어 보이되 주요 콘텐츠 사이 이동 시간은 짧게.
 */

export const ROOM = {
  width: 22,
  depth: 22,
  height: 7,
  wallThickness: 0.4,
} as const;

export const PLAYER = {
  /** 1인칭 눈높이 */
  eyeHeight: 1.62,
  radius: 0.38,
  walkSpeed: 3.6,
  sprintSpeed: 5.4,
  /** 이동 가감속(초당 보간 계수) */
  damping: 12,
  start: { x: 0, z: 4.2 } as const,
  /** 시작 시 바라보는 방향 — 중앙 동상(-z) */
  startYaw: 0,
} as const;

export const STATUE = {
  position: { x: 0, y: 0, z: -1.2 } as const,
  pedestalRadius: 0.85,
  pedestalHeight: 1.1,
  /** 이 거리 안으로 들어오면 About 상호작용 가능 */
  interactRadius: 3.0,
} as const;

/** 책 기본 치수(미터). 책등은 local +z를 향하고, 두께는 local x다. */
export const BOOK = {
  thickness: 0.09,
  height: 0.32,
  depth: 0.23,
  cover: 0.008,
} as const;

export type Yaw = 0 | 90 | 180 | 270;

export interface BookcaseDef {
  id: string;
  /** 책장 뒷판 중심 좌표 */
  x: number;
  z: number;
  /** 0이면 +z를 향해 열림(정면이 남쪽), 90이면 +x를 향해 열림 */
  yaw: Yaw;
  width: number;
  height: number;
  depth: number;
  shelves: number;
}

const SHELF_W = 4.6;
const SHELF_H = 4.4;
const SHELF_D = 0.6;

/** RPD 5장 배치도 — 네 구석 + 중앙 북쪽 */
export const BOOKCASES: BookcaseDef[] = [
  { id: "nw", x: -8.0, z: -4.2, yaw: 90, width: SHELF_W, height: SHELF_H, depth: SHELF_D, shelves: 4 },
  { id: "ne", x: 8.0, z: -4.2, yaw: 270, width: SHELF_W, height: SHELF_H, depth: SHELF_D, shelves: 4 },
  { id: "n", x: 0, z: -9.6, yaw: 0, width: SHELF_W * 1.3, height: SHELF_H, depth: SHELF_D, shelves: 4 },
  { id: "sw", x: -8.0, z: 4.2, yaw: 90, width: SHELF_W, height: SHELF_H, depth: SHELF_D, shelves: 4 },
  { id: "se", x: 8.0, z: 4.2, yaw: 270, width: SHELF_W, height: SHELF_H, depth: SHELF_D, shelves: 4 },
];

export interface DeskDef {
  x: number;
  z: number;
  yaw: Yaw;
  width: number;
  depth: number;
  height: number;
}

/** 분위기용 최소한의 오브젝트(RPD 4.1 — 과도한 배치 금지) */
export const DESKS: DeskDef[] = [
  { x: -4.6, z: -6.6, yaw: 0, width: 2.6, depth: 1.2, height: 0.78 },
  { x: 4.6, z: -6.6, yaw: 0, width: 2.6, depth: 1.2, height: 0.78 },
];

/** 세로로 긴 창문(북쪽 벽 제외 — 북쪽은 중앙 책장이 막고 있다) */
export const WINDOWS = [
  { wall: "west" as const, offset: -5.5 },
  { wall: "west" as const, offset: 5.5 },
  { wall: "east" as const, offset: -5.5 },
  { wall: "east" as const, offset: 5.5 },
];

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function boxToAABB(x: number, z: number, yaw: Yaw, width: number, depth: number): AABB {
  // yaw는 90도 배수만 허용하므로 회전은 폭/깊이 교환으로 처리한다.
  const rotated = yaw === 90 || yaw === 270;
  const ex = (rotated ? depth : width) / 2;
  const ez = (rotated ? width : depth) / 2;
  return { minX: x - ex, maxX: x + ex, minZ: z - ez, maxZ: z + ez };
}

function expand(box: AABB, by: number): AABB {
  return { minX: box.minX - by, maxX: box.maxX + by, minZ: box.minZ - by, maxZ: box.maxZ + by };
}

/** 플레이어가 부딪히는 월드 공간 AABB 목록 */
export const COLLIDERS: AABB[] = [
  ...BOOKCASES.map((b) => boxToAABB(b.x, b.z, b.yaw, b.width, b.depth)),
  ...DESKS.map((d) => boxToAABB(d.x, d.z, d.yaw, d.width, d.depth)),
  // 동상 좌대는 원형이지만 AABB로 근사한다.
  // 시각적 반경보다 넉넉하게 잡아, 흉상을 코앞에서 보지 않고
  // 적당한 거리에서 감상하게 만든다.
  expand(
    boxToAABB(STATUE.position.x, STATUE.position.z, 0, STATUE.pedestalRadius * 2, STATUE.pedestalRadius * 2),
    0.55,
  ),
];

export const BOUNDS = {
  minX: -ROOM.width / 2 + ROOM.wallThickness,
  maxX: ROOM.width / 2 - ROOM.wallThickness,
  minZ: -ROOM.depth / 2 + ROOM.wallThickness,
  maxZ: ROOM.depth / 2 - ROOM.wallThickness,
};

/**
 * 원(플레이어) vs AABB 충돌 해소. 가장 얕게 밀어내는 축으로 밀어낸다.
 * 반환값은 보정된 위치.
 */
export function resolveCollisions(x: number, z: number, radius: number): { x: number; z: number } {
  let px = Math.min(Math.max(x, BOUNDS.minX + radius), BOUNDS.maxX - radius);
  let pz = Math.min(Math.max(z, BOUNDS.minZ + radius), BOUNDS.maxZ - radius);

  for (const box of COLLIDERS) {
    const closestX = Math.min(Math.max(px, box.minX), box.maxX);
    const closestZ = Math.min(Math.max(pz, box.minZ), box.maxZ);
    const dx = px - closestX;
    const dz = pz - closestZ;

    if (dx * dx + dz * dz >= radius * radius) continue;

    if (dx === 0 && dz === 0) {
      // 박스 내부로 들어간 경우: 가장 가까운 면으로 탈출
      const toLeft = px - box.minX;
      const toRight = box.maxX - px;
      const toFront = pz - box.minZ;
      const toBack = box.maxZ - pz;
      const min = Math.min(toLeft, toRight, toFront, toBack);
      if (min === toLeft) px = box.minX - radius;
      else if (min === toRight) px = box.maxX + radius;
      else if (min === toFront) pz = box.minZ - radius;
      else pz = box.maxZ + radius;
      continue;
    }

    const dist = Math.hypot(dx, dz) || 1;
    const push = radius - dist;
    px += (dx / dist) * push;
    pz += (dz / dist) * push;
  }

  return { x: px, z: pz };
}

/**
 * 책 앞에서 책을 바라보는 관람 위치 계산 (프로젝트 인덱스 이동용).
 * 책의 yaw 방향 정면으로 distance만큼 떨어진 지점을 반환한다.
 */
export function viewingSpot(
  position: { x: number; z: number },
  rotationY: number,
  distance = 1.5,
): { x: number; z: number; yaw: number } {
  const nx = Math.sin(rotationY);
  const nz = Math.cos(rotationY);
  const spot = resolveCollisions(position.x + nx * distance, position.z + nz * distance, PLAYER.radius);
  // 카메라 forward는 (-sin yaw, 0, -cos yaw)이므로, 책을 향하는 yaw는 아래와 같다.
  return { ...spot, yaw: Math.atan2(spot.x - position.x, spot.z - position.z) };
}

export interface ShelfSlot {
  label: string;
  bookcaseId: string;
  position: { x: number; y: number; z: number };
  /** 책등이 책장 바깥을 향하도록 하는 Y 회전(라디안) */
  rotationY: number;
}

/**
 * 관리자가 좌표를 손으로 추측하지 않도록 책장 칸 좌표를 미리 계산한다.
 * RPD 20장에서 지적한 "숫자 입력의 불편함"을 3D 에디터와 함께 완화한다.
 */
export function shelfSlots(): ShelfSlot[] {
  const slots: ShelfSlot[] = [];
  /** 책장 앞면에서 살짝 안쪽으로 들어간 위치 */
  const localZ = -0.02;

  for (const shelf of BOOKCASES) {
    const yawRad = (shelf.yaw * Math.PI) / 180;
    const cos = Math.cos(yawRad);
    const sin = Math.sin(yawRad);
    const usable = shelf.width / 2 - 0.35;
    const columns = Math.max(3, Math.round(shelf.width / 1.15));

    for (let level = 0; level < shelf.shelves; level++) {
      // 선반 판의 윗면 + 책 높이의 절반
      const y = 0.18 + (level * (shelf.height - 0.5)) / shelf.shelves + 0.025 + BOOK.height / 2;

      for (let col = 0; col < columns; col++) {
        const localX = columns === 1 ? 0 : -usable + (col * (usable * 2)) / (columns - 1);
        // Ry(yaw): (x, z) → (x·cos + z·sin, -x·sin + z·cos)
        slots.push({
          label: `${shelf.id.toUpperCase()} · L${level + 1} · C${col + 1}`,
          bookcaseId: shelf.id,
          position: {
            x: shelf.x + localX * cos + localZ * sin,
            y,
            z: shelf.z - localX * sin + localZ * cos,
          },
          rotationY: yawRad,
        });
      }
    }
  }

  return slots;
}
