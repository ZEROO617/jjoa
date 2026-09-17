"use client";

import { useGameStore } from "@/store/useGameStore";
import { Book } from "./Book";
import type { Project } from "@/types/project";

/**
 * RPD 42장 — projects 조회 결과를 그대로 책으로 펼친다.
 * 프로젝트를 추가하기 위해 코드를 고칠 일이 없다.
 */
export function Books({ projects }: { projects: Project[] }) {
  const selectedProject = useGameStore((s) => s.selectedProject);
  const focus = useGameStore((s) => s.focus);
  const focusedId = focus?.kind === "book" ? focus.id : null;

  return (
    <group>
      {projects.map((project) => (
        <Book
          key={project.id}
          project={project}
          selected={selectedProject === project.id}
          focused={focusedId === project.id && selectedProject === null}
        />
      ))}
    </group>
  );
}
