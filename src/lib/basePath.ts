/**
 * GitHub Pages 프로젝트 사이트는 https://<user>.github.io/<repo>/ 에 배포되므로
 * basePath 가 필요하다. Next는 next/link · next/image 의 경로만 자동으로
 * 보정하고, 코드 안의 문자열 경로는 건드리지 않는다.
 * 그런 경로는 이 헬퍼로 감싼다.
 *
 * src/data/projects.ts 의 image 경로("/사진.jpg")가 이 헬퍼를 거친다.
 * public/ 안의 파일을 코드에서 문자열로 참조할 때는 반드시 이걸 써야
 * GitHub Pages 하위 경로에서도 깨지지 않는다.
 */
const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** next.config.ts 와 같은 규칙으로 정규화한다("/" 와 끝 슬래시는 빈 값). */
export const BASE_PATH = raw === "/" ? "" : raw.replace(/\/$/, "");

export function withBasePath(path: string): string {
  if (!BASE_PATH) return path;
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
