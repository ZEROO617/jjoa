"use client";

import { withBasePath } from "@/lib/basePath";
import type { Project, ProjectFile } from "@/data/projects";

interface FileSheetProps {
  project: Project;
  file: ProjectFile;
  closing: boolean;
  onBack: () => void;
}

/** 서류철에서 꺼낸 한 장의 서류. */
export function FileSheet({ project, file, closing, onBack }: FileSheetProps) {
  return (
    <div className="sheet-layer">
      <article className={`sheet${closing ? " is-closing" : ""}`}>
        <div className="sheet-eyebrow">
          {project.label} · {file.name}
        </div>

        <h2>{project.label}</h2>
        {project.period && <div className="sheet-period">{project.period}</div>}

        <hr />

        {file.body && <p className="body">{file.body}</p>}

        {file.image && (
          // 로컬 public/ 이미지라 next/image 없이 직접 띄우고 지연 로딩한다.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withBasePath(file.image)} alt={`${project.label} ${file.name}`} loading="lazy" />
        )}

        {file.url && (
          <a className="sheet-link" href={file.url} target="_blank" rel="noopener noreferrer">
            {file.urlLabel ?? "열기"} ↗
          </a>
        )}

        <div>
          <button type="button" className="sheet-back" onClick={onBack}>
            ← 서랍으로 돌아가기
          </button>
        </div>
      </article>
    </div>
  );
}
