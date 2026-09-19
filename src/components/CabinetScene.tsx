"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { DrawerDetail, type FlipOrigin } from "@/components/DrawerDetail";
import { FileSheet } from "@/components/FileSheet";
import type { Project } from "@/data/projects";

/** 화면이 서랍으로 가득 차 보이도록 채우는 최소 칸 수 */
const MIN_DRAWERS = 24;
/** globals.css 의 .open-drawer 너비와 맞춘 값 */
const OPEN_DRAWER_MAX_WIDTH = 760;

const DRAWER_CLOSE_MS = 300;
const SHEET_CLOSE_MS = 240;

interface CabinetSceneProps {
  ownerName: string;
  projects: Project[];
}

/** 화면을 채운 서랍장. 서랍을 누르면 열리고, 안의 서류철을 꺼내 볼 수 있다. */
export function CabinetScene({ ownerName, projects }: CabinetSceneProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<FlipOrigin | null>(null);
  const [drawerClosing, setDrawerClosing] = useState(false);

  const [fileIndex, setFileIndex] = useState<number | null>(null);
  const [sheetClosing, setSheetClosing] = useState(false);

  const openProject = projects.find((p) => p.id === openId) ?? null;
  const openFile = openProject && fileIndex !== null ? openProject.files[fileIndex] : null;

  const closeSheet = useCallback(() => {
    if (fileIndex === null) return;
    setSheetClosing(true);
    window.setTimeout(() => {
      setFileIndex(null);
      setSheetClosing(false);
    }, SHEET_CLOSE_MS);
  }, [fileIndex]);

  const closeDrawer = useCallback(() => {
    if (!openId) return;
    setFileIndex(null);
    setDrawerClosing(true);
    window.setTimeout(() => {
      setOpenId(null);
      setDrawerClosing(false);
    }, DRAWER_CLOSE_MS);
  }, [openId]);

  // ESC — 서류가 펼쳐져 있으면 서류부터, 아니면 서랍을 닫는다.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (fileIndex !== null) closeSheet();
      else if (openId) closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer, closeSheet, fileIndex, openId]);

  // 서랍이 열려 있는 동안 뒤쪽 스크롤을 막는다.
  useEffect(() => {
    if (!openId) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [openId]);

  const openDrawer = (project: Project, event: MouseEvent<HTMLButtonElement>) => {
    // 누른 서랍 자리에서 튀어나오는 것처럼 보이도록 시작 위치를 계산한다.
    const rect = event.currentTarget.getBoundingClientRect();
    const finalWidth = Math.min(OPEN_DRAWER_MAX_WIDTH, window.innerWidth * 0.94);

    setOrigin({
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
      scale: Math.max(0.15, rect.width / finalWidth),
    });
    setFileIndex(null);
    setOpenId(project.id);
  };

  const fillerCount = Math.max(0, MIN_DRAWERS - projects.length);

  return (
    <div className="cabinet">
      <header className="cabinet-bar">
        <h1>{ownerName}</h1>
        <span className="sub">서랍을 눌러 보세요</span>
      </header>

      <div className="drawer-wall">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className="drawer"
            onClick={(event) => openDrawer(project, event)}
            aria-label={`${project.label} 서랍 열기`}
          >
            <span className="drawer-face">
              <span className="drawer-label">
                <span className="drawer-name">{project.label}</span>
                {project.period && <span className="drawer-period">{project.period}</span>}
              </span>
              <span className="drawer-pull" />
            </span>
          </button>
        ))}

        {/* 빈 서랍 — 장식용이라 조작할 수 없다. */}
        {Array.from({ length: fillerCount }, (_, i) => (
          <div key={`empty-${i}`} className="drawer is-empty" aria-hidden="true">
            <span className="drawer-face">
              <span className="drawer-spacer" />
              <span className="drawer-pull" />
            </span>
          </div>
        ))}
      </div>

      {openProject && (
        <div className="detail" role="dialog" aria-modal="true" aria-label={`${openProject.label} 서랍`}>
          <div className="detail-backdrop" onClick={closeDrawer} />

          <DrawerDetail
            project={openProject}
            origin={origin}
            closing={drawerClosing}
            onPickFile={setFileIndex}
            onClose={closeDrawer}
          />

          {openFile && (
            <FileSheet
              project={openProject}
              file={openFile}
              closing={sheetClosing}
              onBack={closeSheet}
            />
          )}
        </div>
      )}
    </div>
  );
}
