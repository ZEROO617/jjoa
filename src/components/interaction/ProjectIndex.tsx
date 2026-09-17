"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { formatPeriod } from "@/lib/format";
import type { Project } from "@/types/project";

/**
 * RPD 34장 — 3D 탐색이 어려운 방문자를 위한 보조 수단.
 * 항목을 고르면 해당 책 앞으로 이동하고 바로 펼친다.
 */
export function ProjectIndex({ projects }: { projects: Project[] }) {
  const indexOpen = useGameStore((s) => s.indexOpen);
  const firstItem = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (indexOpen) firstItem.current?.focus();
  }, [indexOpen]);

  if (!indexOpen) return null;

  const select = (id: string) => {
    const store = useGameStore.getState();
    store.requestTravel(id);
    store.openBook(id);
  };

  return (
    <div
      className="index-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Project index"
      onClick={(e) => {
        if (e.target === e.currentTarget) useGameStore.getState().toggleIndex(false);
      }}
    >
      <div className="index">
        <h2>Project Index</h2>
        <p className="muted">TAB 또는 ESC 로 닫기 · 항목 선택 시 해당 책으로 이동</p>
        <ol>
          {projects.map((project, i) => (
            <li key={project.id}>
              <button
                ref={i === 0 ? firstItem : undefined}
                type="button"
                onClick={() => select(project.id)}
              >
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <span className="title">{project.name}</span>
                <span className="period">{formatPeriod(project.startDate, project.endDate)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
