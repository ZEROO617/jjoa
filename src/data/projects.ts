/**
 * 이 파일 하나만 고치면 사이트가 바뀝니다.
 *
 * - OWNER.name  → 문에 달린 명패에 새겨지는 이름
 * - PROJECTS    → 서랍 한 칸 = 프로젝트 하나. 배열에 항목을 추가하면 서랍이 늘어납니다.
 * - files       → 그 서랍을 열었을 때 안에 들어 있는 서류철
 *
 * 이미지는 public/ 폴더에 넣고 "/파일이름.jpg" 처럼 적으면 됩니다.
 */

export interface ProjectFile {
  /** 서류철 탭에 적히는 이름 */
  name: string;
  /** 서류 본문. 줄바꿈은 그대로 표시됩니다. */
  body?: string;
  /** 외부 링크(누르면 새 탭). 사이트 주소나 GitHub 주소 */
  url?: string;
  /** 링크 버튼에 적힐 글자. 없으면 "열기" */
  urlLabel?: string;
  /** public/ 안의 이미지 경로 (예: "/logisfinder.png") */
  image?: string;
}

export interface Project {
  /** 주소에 쓰이는 고유 값. 영문/숫자/하이픈 */
  id: string;
  /** 서랍 라벨에 크게 적히는 이름 */
  label: string;
  /** 라벨 아래 작은 글씨 (기간) */
  period?: string;
  /** 서랍을 열었을 때 맨 위에 보이는 한 줄 소개 */
  summary?: string;
  files: ProjectFile[];
}

export const OWNER = {
  name: "김윤서",
  /** 명패 아래 작은 글씨 */
  role: "PORTFOLIO",
};

export const PROJECTS: Project[] = [
  {
    id: "logisfinder",
    label: "LOGISFINDER",
    period: "2025.03 — 2025.07",
    summary: "물류 창고의 재고 위치를 실시간으로 추적하는 웹 애플리케이션",
    files: [
      {
        name: "개요",
        body: `바코드 스캔 데이터를 기반으로 창고 내 적재 위치를 시각화하고,
피킹 동선을 최적화하는 웹 애플리케이션입니다.

창고 관리자가 물건을 찾는 데 걸리는 시간을 줄이는 것을 목표로,
실시간 재고 위치 추적과 최단 동선 안내를 함께 제공합니다.`,
      },
      {
        name: "맡은 일",
        body: `프론트엔드 전반과 재고 위치 시각화 로직을 담당했습니다.

· 창고 평면도 위에 재고를 렌더링하는 지도 컴포넌트
· 바코드 스캔 이벤트를 받아 화면에 반영하는 실시간 동기화
· 피킹 동선 계산 및 안내 UI`,
      },
      { name: "링크", url: "https://example.com/logisfinder", urlLabel: "사이트 열기" },
      { name: "코드", url: "https://github.com/example/logisfinder", urlLabel: "GitHub 열기" },
    ],
  },
  {
    id: "sparkup",
    label: "SPARKUP",
    period: "2025.09 — 2026.01",
    summary: "사이드 프로젝트 팀원을 매칭해 주는 플랫폼",
    files: [
      {
        name: "개요",
        body: `기술 스택과 참여 가능 시간대를 기준으로 팀원을 추천하고,
팀이 만들어진 뒤에는 마일스톤 관리까지 이어서 지원합니다.

"사람은 모였는데 진도가 안 나가는" 문제를 줄이는 데 초점을 맞췄습니다.`,
      },
      {
        name: "맡은 일",
        body: `매칭 알고리즘과 팀 대시보드를 만들었습니다.

· 스택·시간대 기반 후보 정렬 로직
· 팀 생성 이후의 마일스톤 보드
· 알림 발송 파이프라인`,
      },
      { name: "링크", url: "https://example.com/sparkup", urlLabel: "사이트 열기" },
    ],
  },
  {
    id: "fake-news-ai",
    label: "FAKE NEWS AI",
    period: "2025.05 — 2025.08",
    summary: "한국어 뉴스 기사의 신뢰도를 판별하는 분류 모델",
    files: [
      {
        name: "개요",
        body: `KoBERT를 파인튜닝해 한국어 뉴스 기사의 신뢰도를 판별합니다.

단순히 진위 여부만 내놓지 않고, 판단 근거가 된 문장을 함께
하이라이트해 왜 그렇게 판단했는지 보여 줍니다.`,
      },
      {
        name: "결과",
        body: `자체 수집한 검증 데이터셋에서 F1 0.89를 기록했습니다.

근거 문장 하이라이트는 어텐션 가중치를 문장 단위로 집계해
상위 문장을 표시하는 방식으로 구현했습니다.`,
      },
      { name: "코드", url: "https://github.com/example/fake-news-ai", urlLabel: "GitHub 열기" },
    ],
  },
  {
    id: "unity-pos",
    label: "UNITY POS",
    period: "2024.11 — 2025.02",
    summary: "Unity로 만든 매장 판매 시뮬레이터",
    files: [
      {
        name: "개요",
        body: `실제 POS 단말의 조작 흐름을 학습용으로 재현했습니다.

주문 · 결제 · 정산 과정을 단계별로 연습할 수 있어,
신입 직원 교육용으로 쓰는 것을 염두에 두고 만들었습니다.`,
      },
      { name: "링크", url: "https://example.com/unity-pos", urlLabel: "사이트 열기" },
    ],
  },
];
