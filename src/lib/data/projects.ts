import { SAMPLE_ABOUT, SAMPLE_PROJECTS } from "@/lib/sample-data";
import { rowToAbout, rowToProject } from "@/lib/supabase/mapper";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AboutProfile, AboutRow, Project, ProjectRow } from "@/types/project";

export interface PortfolioData {
  projects: Project[];
  about: AboutProfile;
  /** true면 샘플 데이터로 렌더링 중(Supabase 미설정 또는 조회 실패) */
  usingSampleData: boolean;
}

/**
 * RPD 42장 — 포트폴리오는 projects 테이블을 그대로 읽어 책을 생성한다.
 * 프로젝트를 추가하기 위해 코드를 수정할 필요가 없다.
 */
export async function loadPortfolioData(): Promise<PortfolioData> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { projects: SAMPLE_PROJECTS, about: SAMPLE_ABOUT, usingSampleData: true };
  }

  const [projectsRes, aboutRes] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: true }),
    supabase.from("about").select("*").limit(1).maybeSingle(),
  ]);

  if (projectsRes.error) {
    console.error("[portfolio] projects 조회 실패:", projectsRes.error.message);
    return { projects: SAMPLE_PROJECTS, about: SAMPLE_ABOUT, usingSampleData: true };
  }

  const projects = (projectsRes.data as ProjectRow[]).map(rowToProject);
  const about = aboutRes.data ? rowToAbout(aboutRes.data as AboutRow) : SAMPLE_ABOUT;

  // 테이블이 비어 있으면 빈 도서관이 되므로 샘플로 채워 준다.
  if (projects.length === 0) {
    return { projects: SAMPLE_PROJECTS, about, usingSampleData: true };
  }

  return { projects, about, usingSampleData: false };
}
