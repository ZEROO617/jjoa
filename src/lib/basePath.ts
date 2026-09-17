/**
 * GitHub Pages 프로젝트 사이트는 https://<user>.github.io/<repo>/ 에 배포되므로
 * basePath 가 필요하다. Next는 next/link · next/image 의 경로만 자동으로
 * 보정하고, 코드 안의 문자열 경로(three.js 로더, 폰트 등)는 건드리지 않는다.
 * 그런 경로는 이 헬퍼로 감싼다.
 *
 * 현재 코드에는 문자열 경로 에셋이 없다(책등·명패 글자는 캔버스로 생성한다).
 * 나중에 /public/models/library.glb 같은 파일을 useGLTF로 불러올 때 반드시
 * 이 헬퍼를 통과시켜야 GitHub Pages 하위 경로에서도 로드된다.
 */
const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** next.config.ts 와 같은 규칙으로 정규화한다("/" 와 끝 슬래시는 빈 값). */
export const BASE_PATH = raw === "/" ? "" : raw.replace(/\/$/, "");

export function withBasePath(path: string): string {
  if (!BASE_PATH) return path;
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
