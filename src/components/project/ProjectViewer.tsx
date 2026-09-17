"use client";

import { useEffect, useRef } from "react";
import { formatPeriod } from "@/lib/format";
import { useGameStore } from "@/store/useGameStore";
import type { Project } from "@/types/project";

/**
 * RPD 13장 — 펼친 책의 양면 레이아웃.
 *
 * 설계 노트: 텍스트 가독성과 외부 링크 클릭 신뢰성을 위해 UI는 CSS3D가 아닌
 * DOM 오버레이로 그린다. 대신 등장/퇴장 애니메이션을 3D 책의 펼침 단계와
 * 정확히 이어 붙여(OPENING 종료 → 오버레이 등장, 닫기 → 오버레이 퇴장 후 CLOSING)
 * 하나의 연속된 동작으로 읽히게 한다.
 */
export function ProjectViewer({ projects }: { projects: Project[] }) {
  const mode = useGameStore((s) => s.interactionMode);
  const selectedProject = useGameStore((s) => s.selectedProject);
  const closeRef = useRef<HTMLButtonElement>(null);

  const project = projects.find((p) => p.id === selectedProject);
  const visible = (mode === "book-open" || mode === "book-closing") && project !== undefined;

  useEffect(() => {
    if (mode === "book-open") closeRef.current?.focus();
  }, [mode]);

  if (!visible || !project) return null;

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={project.name}>
      <article className="spread" data-closing={mode === "book-closing"}>
        <section className="page left">
          <h1>{project.name}</h1>
          <div className="period">{formatPeriod(project.startDate, project.endDate)}</div>

          <div className="cover-frame">
            {project.imageUrl ? (
              // 외부(Supabase Storage) 이미지이므로 next/image 대신 img를 쓰고 지연 로딩한다.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.imageUrl} alt={`${project.name} 대표 이미지`} loading="lazy" decoding="async" />
            ) : (
              <div className="placeholder">NO IMAGE</div>
            )}
          </div>
        </section>

        <section className="page right">
          <div className="section-label">Overview</div>
          <p className="description">{project.description}</p>

          <div className="actions">
            {project.projectUrl && (
              <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                Project
              </a>
            )}
            {project.githubUrl && (
              <a className="ghost" href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            )}
          </div>
        </section>
      </article>

      <button
        ref={closeRef}
        type="button"
        className="viewer-close"
        onClick={() => useGameStore.getState().closeBook()}
      >
        Close · ESC
      </button>
    </div>
  );
}
