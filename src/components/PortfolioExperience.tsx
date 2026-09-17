"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AboutPanel } from "@/components/interaction/AboutPanel";
import { ControlsHint } from "@/components/interaction/ControlsHint";
import { Crosshair } from "@/components/interaction/Crosshair";
import { InteractionPrompt } from "@/components/interaction/InteractionPrompt";
import { ProjectIndex } from "@/components/interaction/ProjectIndex";
import { ProjectViewer } from "@/components/project/ProjectViewer";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useGameStore } from "@/store/useGameStore";
import type { AboutProfile, Project } from "@/types/project";

// WebGL 씬은 SSR 대상이 아니다.
const LibraryScene = dynamic(
  () => import("@/components/scene/LibraryScene").then((m) => m.LibraryScene),
  { ssr: false },
);

interface Props {
  projects: Project[];
  about: AboutProfile;
  usingSampleData: boolean;
}

export function PortfolioExperience({ projects, about, usingSampleData }: Props) {
  const pointerLocked = useGameStore((s) => s.pointerLocked);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const touchMode = useIsTouchDevice();
  const [noticeVisible, setNoticeVisible] = useState(usingSampleData);

  useAmbientAudio();

  // RPD 6장 — 전역 키 입력
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const store = useGameStore.getState();

      if (e.code === "Tab") {
        e.preventDefault();
        if (store.interactionMode !== "explore") return;
        store.toggleIndex();
        return;
      }

      if (e.code === "Escape") {
        // 책이 열려 있으면 책을 닫고, 인덱스가 열려 있으면 인덱스를 닫는다.
        if (store.interactionMode === "book-open" || store.interactionMode === "book-opening") {
          store.closeBook();
        } else if (store.indexOpen) {
          store.toggleIndex(false);
        }
        return;
      }

      if (e.code === "KeyE") {
        if (store.interactionMode !== "explore" || store.indexOpen) return;
        if (store.focus?.kind === "book") store.openBook(store.focus.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="experience" data-locked={pointerLocked}>
      <LibraryScene projects={projects} about={about} />

      <div className="hud">
        <Crosshair />
        <InteractionPrompt touchMode={touchMode} />
        <ControlsHint touchMode={touchMode} />
        <AboutPanel about={about} />
        <ProjectIndex projects={projects} />
        <ProjectViewer projects={projects} />

        <div className="corner-controls">
          <button type="button" onClick={() => useGameStore.getState().toggleIndex()}>
            Index · Tab
          </button>
          <button type="button" onClick={() => useGameStore.getState().toggleSound()}>
            Sound {soundEnabled ? "On" : "Off"}
          </button>
        </div>

        {noticeVisible && (
          <div className="notice" style={{ pointerEvents: "auto" }}>
            Supabase가 연결되지 않아 샘플 프로젝트로 표시 중입니다. <br />
            <button
              type="button"
              onClick={() => setNoticeVisible(false)}
              style={{
                marginTop: 6,
                background: "none",
                border: "none",
                padding: 0,
                color: "inherit",
                textDecoration: "underline",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              닫기
            </button>
          </div>
        )}
      </div>

      <LoadingScreen />
    </div>
  );
}
