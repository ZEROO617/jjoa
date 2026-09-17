"use client";

import { useEffect, useState } from "react";
import { SAMPLE_ABOUT, SAMPLE_PROJECTS } from "@/lib/sample-data";
import { getSupabaseClient } from "@/lib/supabase/client";
import { rowToAbout, rowToProject } from "@/lib/supabase/mapper";
import type { AboutProfile, AboutRow, Project, ProjectRow } from "@/types/project";

export interface PortfolioData {
  projects: Project[];
  about: AboutProfile;
  /** true면 샘플 데이터로 렌더링 중(Supabase 미설정 또는 조회 실패) */
  usingSampleData: boolean;
  loading: boolean;
}

/**
 * RPD 42장 — projects 테이블을 그대로 읽어 책을 만든다.
 *
 * 조회를 브라우저에서 하는 이유: 정적 배포(GitHub Pages)에는 서버가 없다.
 * 빌드 시점에 가져오면 프로젝트를 추가할 때마다 재빌드해야 하므로,
 * "코드를 수정하지 않고 프로젝트를 추가한다"는 요구가 깨진다.
 * 브라우저에서 조회하면 관리자가 저장한 뒤 새로고침만으로 반영된다.
 *
 * anon key는 공개되는 값이고, 쓰기는 RLS가 막는다(supabase/schema.sql).
 */
export function usePortfolioData(): PortfolioData {
  const [data, setData] = useState<Omit<PortfolioData, "loading">>({
    projects: SAMPLE_PROJECTS,
    about: SAMPLE_ABOUT,
    usingSampleData: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const [projectsRes, aboutRes] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: true }),
        supabase.from("about").select("*").limit(1).maybeSingle(),
      ]);
      if (cancelled) return;

      if (projectsRes.error) {
        console.error("[portfolio] projects 조회 실패:", projectsRes.error.message);
        setLoading(false);
        return;
      }

      const projects = (projectsRes.data as ProjectRow[]).map(rowToProject);
      const about = aboutRes.data ? rowToAbout(aboutRes.data as AboutRow) : SAMPLE_ABOUT;

      // 테이블이 비어 있으면 빈 도서관이 되므로 샘플로 채워 준다.
      setData(
        projects.length > 0
          ? { projects, about, usingSampleData: false }
          : { projects: SAMPLE_PROJECTS, about, usingSampleData: true },
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading };
}
