import type { AboutProfile, Project } from "@/types/project";

const now = "2026-01-01T00:00:00.000Z";

/**
 * Supabase 환경변수가 없을 때 쓰는 폴백 데이터.
 * 3D 씬/애니메이션을 DB 없이도 개발·검증할 수 있게 한다.
 * 좌표는 src/components/scene/layout.ts 의 책장 배치와 맞춰 둔 값이다.
 */
export const SAMPLE_PROJECTS: Project[] = [
  {
    id: "sample-logisfinder",
    name: "LogisFinder",
    bookTitle: "LOGIS\nFINDER",
    description:
      "물류 창고의 재고 위치를 실시간으로 추적하는 웹 애플리케이션. 바코드 스캔 데이터를 기반으로 적재 위치를 시각화하고, 피킹 동선을 최적화한다.",
    startDate: "2025-03",
    endDate: "2025-07",
    projectUrl: "https://example.com/logisfinder",
    githubUrl: "https://github.com/example/logisfinder",
    bookColor: "#4a2f1c",
    // 좌표는 layout.ts의 shelfSlots()가 계산한 실제 책장 칸 값이다 (NW · L2 · C2).
    position: { x: -8.02, y: 1.34, z: -3.55 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sample-sparkup",
    name: "SparkUp",
    bookTitle: "SPARK\nUP",
    description:
      "사이드 프로젝트 팀원을 매칭해 주는 플랫폼. 기술 스택과 가능 시간대를 기준으로 추천하고, 팀 결성 이후 마일스톤 관리까지 지원한다.",
    startDate: "2025-09",
    endDate: "2026-01",
    projectUrl: "https://example.com/sparkup",
    githubUrl: "https://github.com/example/sparkup",
    bookColor: "#1f3b2c",
    position: { x: 8.02, y: 1.34, z: -3.55 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sample-fakenews",
    name: "Fake News AI",
    bookTitle: "FAKE\nNEWS",
    description:
      "한국어 뉴스 기사의 신뢰도를 판별하는 분류 모델. KoBERT를 파인튜닝하고, 근거 문장을 하이라이트해 판단 이유를 함께 제시한다.",
    startDate: "2025-05",
    endDate: "2025-08",
    githubUrl: "https://github.com/example/fake-news-ai",
    bookColor: "#1c2a45",
    position: { x: -1.32, y: 2.315, z: -9.62 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sample-unity-pos",
    name: "Unity POS",
    bookTitle: "UNITY\nPOS",
    description:
      "Unity로 만든 매장 판매 시뮬레이터. 실제 POS 단말의 조작 흐름을 학습용으로 재현했고, 주문·결제·정산 과정을 단계별로 연습할 수 있다.",
    startDate: "2024-11",
    endDate: "2025-02",
    projectUrl: "https://example.com/unity-pos",
    bookColor: "#5c1f2b",
    position: { x: -8.02, y: 2.315, z: 3.55 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sample-library",
    name: "3D Library Portfolio",
    bookTitle: "THE\nLIBRARY",
    description:
      "지금 보고 있는 이 사이트. React Three Fiber로 만든 1인칭 도서관 포트폴리오. 책 한 권이 프로젝트 하나이며, 모든 책은 관리자 페이지에서 추가·배치한다.",
    startDate: "2026-02",
    githubUrl: "https://github.com/zeroo617/jjoa",
    bookColor: "#3a2b4a",
    position: { x: 8.02, y: 2.315, z: 3.55 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    createdAt: now,
    updatedAt: now,
  },
];

export const SAMPLE_ABOUT: AboutProfile = {
  id: "sample-about",
  name: "KIM YOONSEO",
  title: "Developer",
  affiliation: "Global Media",
  tagline: "Building things with\nCode, AI and Interactive Media.",
  links: [{ label: "GitHub", url: "https://github.com/zeroo617" }],
  updatedAt: now,
};
