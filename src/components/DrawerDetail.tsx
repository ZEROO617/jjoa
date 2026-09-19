"use client";

import type { CSSProperties } from "react";
import type { Project } from "@/data/projects";

export interface FlipOrigin {
  x: number;
  y: number;
  scale: number;
}

interface DrawerDetailProps {
  project: Project;
  origin: FlipOrigin | null;
  closing: boolean;
  onPickFile: (index: number) => void;
  onClose: () => void;
}

/** 서류철 종류를 한눈에 알려 주는 짧은 꼬리표 */
function kindOf(file: Project["files"][number]): string {
  if (file.url) return "LINK";
  if (file.image) return "IMAGE";
  return "DOC";
}

/** 화면 가운데로 빠져나온 서랍. 안에 서류철이 꽂혀 있다. */
export function DrawerDetail({ project, origin, closing, onPickFile, onClose }: DrawerDetailProps) {
  // 클릭한 서랍 위치에서 튀어나오도록 FLIP 시작값을 CSS 변수로 넘긴다.
  const style = origin
    ? ({
        "--from-x": `${origin.x}px`,
        "--from-y": `${origin.y}px`,
        "--from-scale": origin.scale,
      } as CSSProperties)
    : undefined;

  return (
    <div className={`open-drawer${closing ? " is-closing" : ""}`} style={style}>
      <button type="button" className="detail-close" onClick={onClose}>
        닫기 · ESC
      </button>

      <div className="drawer-interior">
        {project.summary && <p className="drawer-summary">{project.summary}</p>}

        <div className="folders">
          {project.files.map((file, index) => (
            <button
              key={file.name}
              type="button"
              className="folder"
              onClick={() => onPickFile(index)}
            >
              <span className="folder-name">{file.name}</span>
              <span className="folder-kind">{kindOf(file)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="open-drawer-front">
        <span className="drawer-label">
          <span className="drawer-name">{project.label}</span>
          {project.period && <span className="drawer-period">{project.period}</span>}
        </span>
        <span className="drawer-pull" />
      </div>
    </div>
  );
}
