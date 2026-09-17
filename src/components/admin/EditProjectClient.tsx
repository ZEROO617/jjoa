"use client";

import { useEffect, useState } from "react";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { getProject } from "@/lib/data/admin";
import type { Project } from "@/types/project";

/** 편집 대상은 인증된 클라이언트에서 조회한다(RLS 세션이 브라우저에 있으므로). */
export function EditProjectClient({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProject(id)
      .then(setProject)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [id]);

  if (error) return <div className="alert">{error}</div>;
  if (!project) return <p className="muted">Loading...</p>;
  return <ProjectForm project={project} />;
}
