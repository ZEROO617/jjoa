"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { deleteProject, listProjects } from "@/lib/data/admin";
import { formatPeriod } from "@/lib/format";
import type { Project } from "@/types/project";

/** RPD 18장 — 관리자 Dashboard. */
export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await listProjects());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onDelete = async (project: Project) => {
    if (!window.confirm(`"${project.name}" 프로젝트를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setBusyId(project.id);
    try {
      await deleteProject(project.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <h2>Projects</h2>
      {error && <div className="alert">{error}</div>}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="muted">등록된 프로젝트가 없습니다. 첫 번째 책을 만들어 보세요.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: 34 }} />
              <th>Name</th>
              <th>Book Title</th>
              <th>Period</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>
                  <span className="swatch" style={{ background: project.bookColor }} />
                </td>
                <td>{project.name}</td>
                <td className="muted" style={{ whiteSpace: "pre-line" }}>
                  {project.bookTitle.replace(/\\n/g, " ")}
                </td>
                <td className="muted">{formatPeriod(project.startDate, project.endDate)}</td>
                <td>
                  <div className="row-actions">
                    <Link className="btn" href={`/admin/projects/${project.id}`}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn danger"
                      disabled={busyId === project.id}
                      onClick={() => void onDelete(project)}
                    >
                      {busyId === project.id ? "..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="form-actions">
        <Link className="btn primary" href="/admin/projects/new">
          + New Project
        </Link>
        <Link className="btn" href="/admin/editor">
          Open 3D Book Editor
        </Link>
      </div>
    </section>
  );
}
