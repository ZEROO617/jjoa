# 김윤서 — 포트폴리오

흰 배경에 문이 하나 있습니다. 문에 달린 명패에 이름이 새겨져 있고,
문을 누르면 열리면서 안으로 들어갑니다. 안에는 서랍장이 화면을 가득 채우고 있고,
서랍을 누르면 열리면서 그 안의 서류철을 꺼내 볼 수 있습니다.

```text
문  →  들어가기  →  서랍장  →  서랍 열기  →  서류 보기
```

**서랍 하나 = 프로젝트 하나**입니다.

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
```

## 내용 바꾸기 — `src/data/projects.ts` 한 파일

이 파일만 고치면 사이트가 바뀝니다. 다른 파일은 건드릴 필요가 없습니다.

```ts
export const OWNER = {
  name: "김윤서",      // 문 명패에 새겨지는 이름
  role: "PORTFOLIO",   // 명패 아래 작은 글씨
};

export const PROJECTS: Project[] = [
  {
    id: "logisfinder",                    // 고유 값 (영문/숫자/하이픈)
    label: "LOGISFINDER",                 // 서랍 라벨에 크게
    period: "2025.03 — 2025.07",          // 라벨 아래 작게
    summary: "물류 창고 재고 추적 웹앱",   // 서랍을 열면 맨 위에
    files: [
      { name: "개요", body: "여러 줄로\n써도 그대로 나옵니다." },
      { name: "화면", image: "/logisfinder.png" },
      { name: "링크", url: "https://example.com", urlLabel: "사이트 열기" },
    ],
  },
  // 서랍을 늘리려면 여기에 항목을 추가하세요.
];
```

| 넣는 값 | 결과 |
| --- | --- |
| `body` | 서류에 본문으로 표시됩니다. 줄바꿈이 그대로 유지됩니다. |
| `image` | `public/` 폴더에 파일을 넣고 `"/파일이름.png"` 으로 적습니다. |
| `url` | 새 탭으로 열리는 링크 버튼이 생깁니다. |

한 항목에 `body` 와 `image` 와 `url` 을 함께 넣어도 됩니다.

서랍장은 등록한 프로젝트 수와 상관없이 **항상 24칸**으로 채워집니다.
남는 칸은 라벨 없는 빈 서랍으로, 눌러도 아무 일이 일어나지 않습니다.
(`src/components/CabinetScene.tsx` 의 `MIN_DRAWERS`)

## 조작

| 입력 | 동작 |
| --- | --- |
| 문 클릭 | 문이 열리고 안으로 들어갑니다 |
| 서랍 클릭 | 서랍이 그 자리에서 튀어나오며 열립니다 |
| 서류철 클릭 | 서류가 서랍에서 올라옵니다 |
| `Esc` | 서류 → 서랍 순서로 닫힙니다 |

마우스 없이 `Tab` 키만으로도 전부 조작할 수 있습니다.
OS에서 "동작 줄이기"를 켜 둔 사용자에게는 긴 연출을 건너뜁니다.

## 배포

### GitHub Pages

`main` 또는 개발 브랜치에 push하면 `.github/workflows/deploy-pages.yml` 이
정적 사이트를 만들어 배포합니다. **처음 한 번은 저장소 설정이 필요합니다.**

> **Settings → Pages → Build and deployment → Source** 를 `GitHub Actions` 로 변경
>
> 이걸 바꾸지 않으면 GitHub 내장 워크플로(`pages build and deployment`)가
> push마다 함께 돌면서 저장소 루트를 배포하려 합니다. 루트에는 `index.html` 이
> 없으므로, 내장 워크플로가 나중에 끝나는 순간 빈 페이지가 서빙됩니다.

로컬에서 같은 결과물을 만들려면:

```bash
NEXT_PUBLIC_BASE_PATH=/jjoa npm run build:pages   # → out/
```

### Node 서버 (Vercel 등)

```bash
npm run build && npm start
```

같은 코드가 그대로 동작합니다.

## 구조

```text
src/
  data/projects.ts        ← 내용은 전부 여기 (편집 지점)
  app/
    page.tsx              루트
    layout.tsx            메타데이터
    globals.css           스타일 전체
  components/
    Portfolio.tsx         문 ↔ 서랍장 전환
    DoorScene.tsx         문 · 명패 · 열리고 들어가는 연출
    CabinetScene.tsx      서랍 벽 · 열고 닫기 상태
    DrawerDetail.tsx      열린 서랍 · 서류철
    FileSheet.tsx         서류 한 장
  hooks/useReducedMotion.ts
  lib/basePath.ts         GitHub Pages 하위 경로에서 이미지 경로 보정
```

의존성은 `next`, `react`, `react-dom` 셋뿐입니다.
애니메이션은 전부 CSS로 처리하며 애니메이션 라이브러리를 쓰지 않습니다.

## 만들면서 정한 것

- **서랍이 튀어나오는 위치**는 누른 서랍의 화면 좌표를 재서 결정합니다(FLIP).
  그래서 어느 서랍을 눌러도 "그 자리에서" 빠져나오는 것처럼 보입니다.
- **한글 자간**은 라틴 문자보다 좁게 잡았습니다. 영문 라벨에 어울리는 넓은
  자간(`0.2em` 이상)을 한글에 그대로 쓰면 글자가 흩어져 보입니다.
- **이미지 경로는 `withBasePath()` 를 거칩니다.** GitHub Pages 하위 경로
  (`/jjoa/`)에서 `public/` 파일을 문자열로 참조하면 그냥은 404가 납니다.

## 검증 상태

- `npm run typecheck`, `npm run build` 통과.
- 실제 Chromium에서 전체 흐름 확인: 문 명패 표시 → 클릭 → 열림 → 진입 →
  서랍 벽 → 서랍 열기 → 서류철 → 서류 본문 → 외부 링크
  (`target="_blank" rel="noopener noreferrer"`) → `Esc` 로 서류·서랍 순차 닫기.
  실패한 요청 0건, 콘솔 에러 0건.

## 알려진 사항

- `npm audit` 이 `postcss` 취약점을 보고합니다. Next 15가 고정한 빌드 전용
  의존성이며 non-breaking 수정본이 아직 없습니다. 신뢰할 수 없는 CSS를
  처리하지 않으므로 실사용 영향은 없습니다.
