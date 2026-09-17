# 3D Library Portfolio

오래된 도서관을 1인칭으로 돌아다니며 프로젝트를 발견하는 인터랙티브 포트폴리오.
책 한 권이 프로젝트 하나이고, 책을 꺼내 펼치면 프로젝트 상세가 지면 위에 나타난다.

```text
Explore → Discover → Open → Read
```

## 빠르게 실행

```bash
npm install
npm run dev     # http://localhost:3000
```

Supabase 환경변수가 없으면 자동으로 샘플 프로젝트 5권으로 동작한다.
3D 씬과 인터랙션은 DB 없이도 전부 확인할 수 있다.

## 조작

| 입력 | 동작 |
| --- | --- |
| 클릭 | Pointer Lock (마우스 시점 고정) |
| `W` `A` `S` `D` | 이동 (`Shift` 빨리 걷기) |
| 마우스 | 시점 |
| `E` | 조준한 책 펼치기 |
| `Tab` | Project Index (책 목록 → 해당 책으로 이동) |
| `Esc` | 책 닫기 / 인덱스 닫기 / 포인터 락 해제 |

터치 기기는 Viewer Mode로 동작한다 — 드래그로 시점, 책을 탭하면 이동 후 펼침.

## Supabase 연결

1. Supabase 프로젝트를 만들고 `.env.example` 을 `.env.local` 로 복사해 채운다.

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

2. `supabase/schema.sql` 을 SQL Editor에 붙여넣어 실행한다.
   `projects` / `about` 테이블, RLS 정책, `portfolio` Storage 버킷이 함께 생성된다.

3. Authentication > Users 에서 관리자 계정 하나를 추가한다.
   이후 `/admin` 에서 그 계정으로 로그인한다.

anon key는 공개되는 값이므로 숨기지 않는다. 실제 권한 통제는 RLS가 담당한다.

- 방문자(`anon`) — `projects` / `about` **SELECT만**
- 관리자(`authenticated`) — SELECT / INSERT / UPDATE / DELETE, Storage 업로드

## 관리자

| 경로 | 설명 |
| --- | --- |
| `/admin` | 프로젝트 목록 (생성 / 수정 / 삭제) |
| `/admin/projects/new` | 새 프로젝트 |
| `/admin/projects/[id]` | 프로젝트 수정 |
| `/admin/editor` | 3D Book Editor — 기즈모로 책을 옮기고 Transform을 저장 |
| `/admin/about` | 중앙 동상의 About 정보 |

새 프로젝트를 추가할 때 **코드를 수정할 필요가 없다.** 포트폴리오는 매 요청마다
`projects` 를 읽어 책을 생성한다.

책 위치는 세 가지 방법으로 지정할 수 있다.

1. 폼의 **책장 칸에서 위치 고르기** — `layout.ts` 가 계산한 84개 슬롯 중 선택
2. Position / Rotation / Scale 직접 입력 (회전은 폼에서 도(°), DB에는 라디안)
3. `/admin/editor` 에서 드래그

## 구조

```text
src/
  app/                    라우트 (/, /admin/*)
  components/
    scene/                3D — Library, Player, Book, Statue, Lighting, Dust
      layout.ts           도서관 치수·충돌·책장 슬롯의 단일 출처
    interaction/          HUD — Crosshair, Prompt, Hint, About, Index
    project/              펼친 책의 프로젝트 UI
    admin/                로그인, 목록, 폼, 3D 에디터
  hooks/                  입력, 앰비언트 오디오, 터치 감지
  store/useGameStore.ts   인터랙션 상태 (DB 데이터와 분리)
  lib/                    Supabase 클라이언트 / 매퍼 / 데이터 접근
  types/project.ts        Project, AboutProfile
supabase/schema.sql       테이블 + RLS + Storage
```

### 책 상태 머신

```text
IDLE → HOVERED → PULLING → OPENING → OPEN → CLOSING → RETURNING → IDLE
```

`Book.tsx` 가 `useFrame` 에서 직접 구동한다. 책은 책장 좌표에서 2차 베지어 경로로
카메라 앞까지 날아오고(`PULLING`), 책등을 축으로 표지가 열리며(`OPENING`),
열람 크기(`OPEN_SCALE`)까지 확대돼 지면이 화면을 채운다. 프로젝트 UI는 그 직후
같은 축으로 등장해 하나의 동작처럼 이어진다.

## 구현 노트 (RPD와 다른 부분)

- **도서관 지오메트리는 절차적**이다. RPD 27장은 Blender `.glb` 를 권장하지만
  이 저장소에는 바이너리 3D 에셋을 넣지 않았다. 치수는 `layout.ts` 에 모여 있으므로,
  나중에 `Library.glb` 를 만들면 `Library.tsx` 만 `useGLTF` 로 교체하면 된다.
  충돌과 책 좌표는 그대로 유지된다. 동상도 같은 이유로 절차적 형태다.
- **프로젝트 상세 UI는 CSS3D가 아닌 DOM 오버레이**다. 텍스트 가독성과 외부 링크
  클릭 신뢰성을 위한 선택이다. 대신 3D 책을 열람 시 확대해 지면이 오버레이보다
  크게 보이도록 맞춰, UI가 지면에 인쇄된 것처럼 읽히게 했다.
- **앰비언트 사운드는 Web Audio로 합성**한다(오디오 파일 없음). 브라우저 자동재생
  정책에 맞춰 사용자가 `Sound On` 을 누른 뒤에만 AudioContext를 만든다.
- **책등 폰트는 자체 호스팅**한다(`public/fonts/spine-latin.ttf`, EB Garamond
  Latin 서브셋 27KB). drei의 `<Text>` 는 폰트가 준비될 때까지 React를 suspend하고,
  `font` 를 지정하지 않으면 troika가 jsdelivr CDN에서 폰트를 받아온다. 그 요청이
  느리거나 차단되면 도서관 전체가 로딩 화면에서 멈춘다. 그래서 폰트를 직접 호스팅하고,
  텍스트마다 `Suspense` 경계를 따로 두어(`SpineText.tsx`) 폰트 문제가 씬 렌더링을
  막지 못하게 했다.

## 경량화 / 성능

- 모든 책이 `BoxGeometry` 3개를 공유한다. 책마다 달라지는 것은 재질 색과 책등 텍스트뿐.
- 실시간 광원 4개(ambient/hemisphere/directional/point×2 + 동상 spot)만 사용하고,
  그림자는 directional 하나만 굽는다.
- 먼지는 `Points` 하나(170개)로 처리한다.
- `AdaptiveDpr` + `dpr={[1, 1.75]}` 로 저성능 기기에서 해상도를 낮춘다.
- 외부 3D 에셋이 없어 초기 다운로드는 JS(첫 로드 ≈209KB) + 폰트 27KB 뿐이다.
- 프로젝트 대표 이미지는 `loading="lazy"` 로 필요할 때 받는다.

## 검증 상태

- `npm run typecheck`, `npm run build` 통과.
- 실제 Chromium에서 확인: 로딩 화면 해제, Pointer Lock, WASD 이동, 벽/동상 충돌,
  동상 근접 About 표시, `Tab` 인덱스, 인덱스 이동, 크로스헤어 조준 → `[E]` 프롬프트,
  `E` 로 펼치기, 프로젝트 UI(제목·기간·개요·외부 링크 `target="_blank" rel="noopener noreferrer"`),
  `Esc` 로 닫고 책장 복귀, 탐색 상태 복구. 콘솔 에러 없음.
- **Supabase 의존 경로(로그인, CRUD, 이미지 업로드, 3D 에디터 저장)는 구현했지만
  실제 인스턴스로는 검증하지 못했다** — 이 환경에 Supabase 자격 증명이 없었다.
  `.env.local` 을 채우고 `schema.sql` 을 실행한 뒤 한 번 확인이 필요하다.

## 알려진 사항

- `npm audit` 이 `postcss` 취약점을 보고한다. Next 15가 고정한 빌드 전용 의존성이며
  non-breaking 수정본이 아직 없다. 신뢰할 수 없는 CSS를 처리하지 않으므로 실사용
  영향은 없다.
- `.npmrc` 에 `legacy-peer-deps=true` 를 둔다. `@react-three/fiber` 9의 optional
  peer(expo 계열)와 React 19가 충돌해 설치가 실패하는 것을 막기 위한 설정이다.

## 다음 단계

- Blender로 `Library.glb` / `Book.glb` 제작 후 교체 (+ baked lighting)
- 앰비언트 사운드를 실제 녹음 파일로 교체
- 모바일 Virtual Joystick
