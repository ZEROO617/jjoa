import type { NextConfig } from "next";

/**
 * 두 가지 배포 방식을 모두 지원한다.
 *
 * 1. Node 서버 (Vercel 등)  — 기본값. `npm run build`
 * 2. 정적 내보내기 (GitHub Pages) — `NEXT_OUTPUT=export npm run build`
 *    → out/ 디렉터리 생성. 서버가 없으므로 프로젝트 데이터는
 *      브라우저에서 Supabase를 직접 조회한다(src/hooks/usePortfolioData.ts).
 */
const isExport = process.env.NEXT_OUTPUT === "export";

/**
 * GitHub Pages 프로젝트 사이트의 하위 경로 (예: "/jjoa").
 * 사용자/조직 사이트(<owner>.github.io)는 하위 경로가 없다.
 * actions/configure-pages 는 그 경우 "/" 를 주는데, Next는 basePath="/" 를
 * 거부하므로 빈 값으로 정규화한다. 끝 슬래시도 제거한다.
 */
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  ...(isExport
    ? {
        output: "export" as const,
        // Pages는 /admin 같은 경로를 /admin/index.html 로 찾으므로 슬래시를 붙인다.
        trailingSlash: true,
      }
    : {}),

  ...(basePath ? { basePath, assetPrefix: basePath } : {}),

  images: {
    // 이미지 최적화는 서버가 필요하다. 대표 이미지는 <img loading="lazy"> 로
    // 직접 렌더링하므로 최적화를 끈다.
    unoptimized: true,
  },

  // three.js는 ESM 전용 예제 모듈을 포함하므로 트랜스파일 대상에 포함한다.
  transpilePackages: ["three"],
};

export default nextConfig;
