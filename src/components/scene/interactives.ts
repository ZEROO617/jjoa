import type { Object3D } from "three";

export type InteractiveKind = "book";

interface Entry {
  id: string;
  kind: InteractiveKind;
  object: Object3D;
}

/**
 * 크로스헤어 레이캐스트 대상 레지스트리.
 * 포인터 락 상태에서는 마우스 좌표 기반 포인터 이벤트를 신뢰할 수 없으므로
 * 화면 중앙(NDC 0,0)에서 직접 레이캐스트한다.
 */
const registry = new Map<Object3D, Entry>();

export function registerInteractive(object: Object3D, id: string, kind: InteractiveKind): () => void {
  registry.set(object, { id, kind, object });
  return () => {
    registry.delete(object);
  };
}

export function interactiveObjects(): Object3D[] {
  return [...registry.keys()];
}

export function lookupInteractive(object: Object3D): Entry | undefined {
  let current: Object3D | null = object;
  while (current) {
    const hit = registry.get(current);
    if (hit) return hit;
    current = current.parent;
  }
  return undefined;
}
