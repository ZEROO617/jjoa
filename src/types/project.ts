/** RPD 21장 — 3D 책 하나가 프로젝트 하나에 대응한다. */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Project {
  id: string;

  /** 실제 프로젝트 이름 (상세 UI 제목) */
  name: string;
  /** 책등에 새길 제목. 줄바꿈(\n)으로 두 줄 이상 표기 가능 */
  bookTitle: string;

  description: string;

  startDate: string;
  endDate?: string;

  projectUrl?: string;
  githubUrl?: string;

  imageUrl?: string;

  /** 책 표지/책등 재질 색 (#RRGGBB) */
  bookColor: string;

  position: Vec3;
  rotation: Vec3;
  scale: Vec3;

  createdAt: string;
  updatedAt: string;
}

/** RPD 8장 — 동상의 About 정보도 DB에서 관리한다. */
export interface AboutProfile {
  id: string;
  name: string;
  title: string;
  affiliation: string;
  tagline: string;
  links: AboutLink[];
  updatedAt: string;
}

export interface AboutLink {
  label: string;
  url: string;
}

/** DB(snake_case) ↔ 앱(camelCase) 경계용 행 타입 */
export interface ProjectRow {
  id: string;
  name: string;
  book_title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  project_url: string | null;
  github_url: string | null;
  image_url: string | null;
  book_color: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
  created_at: string;
  updated_at: string;
}

export interface AboutRow {
  id: string;
  name: string;
  title: string;
  affiliation: string | null;
  tagline: string | null;
  links: AboutLink[] | null;
  updated_at: string;
}

/** 폼 입력값 — id/타임스탬프는 DB가 채운다. */
export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;
